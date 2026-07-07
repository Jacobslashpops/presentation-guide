/**
 * Transcription module — OpenAI Whisper API integration
 *
 * Used as a fallback when YouTube built-in subtitles are unavailable.
 * Uses youtubei.js (InnerTube API) for audio download — no yt-dlp or cookies needed.
 * Requires: OPENAI_API_KEY env var, ffmpeg installed on the server.
 */

import OpenAI from 'openai'
import { Innertube } from 'youtubei.js'
import { exec } from 'child_process'
import { promisify } from 'util'
import { stat, readFile, rm, writeFile, mkdir } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'

const execAsync = promisify(exec)

// Whisper API limit: 25MB per file
const MAX_FILE_SIZE = 24 * 1024 * 1024

export interface WhisperTranscriptionResult {
  text: string
  language: string | null
}

/**
 * Extract video ID from YouTube URL
 */
function extractVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  // Maybe it's already a video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url
  return null
}

/**
 * Download audio from a YouTube video using youtubei.js (InnerTube API).
 * No cookies, no yt-dlp needed — pure Node.js.
 * Returns the path to the downloaded audio file.
 */
async function downloadAudio(videoUrl: string, outputDir: string): Promise<string> {
  const videoId = extractVideoId(videoUrl)
  if (!videoId) {
    throw new Error('无法从 URL 中提取 YouTube 视频 ID')
  }

  let innertube: Innertube
  try {
    innertube = await Innertube.create({
      retrieve_player: true,
      generate_session_locally: true,
    })
  } catch (err) {
    throw new Error(`InnerTube 初始化失败: ${(err as Error).message}`)
  }

  let info
  try {
    info = await innertube.getBasicInfo(videoId)
  } catch (err) {
    throw new Error(`获取视频信息失败: ${(err as Error).message}`)
  }

  if (!info || !info.streaming_data) {
    throw new Error('无法获取视频流数据，视频可能不可用')
  }

  // Get the best audio-only format (highest bitrate)
  const audioFormat = info.chooseFormat({
    type: 'audio',
    quality: 'best',
  })

  if (!audioFormat) {
    throw new Error('未找到可用的音频流格式')
  }

  // Get the deciphered streaming URL
  const streamUrl = await audioFormat.decipher(innertube.session.player)

  // Download the audio stream to a file
  const ext = audioFormat.mime_type?.includes('webm') ? 'webm' : 'mp4'
  const outputFile = join(outputDir, `${randomUUID()}.${ext}`)

  try {
    const response = await fetch(streamUrl)
    if (!response.ok || !response.body) {
      throw new Error(`音频流下载失败: HTTP ${response.status}`)
    }

    // Convert Web ReadableStream to Node.js Readable and pipe to file
    const nodeStream = Readable.fromWeb(response.body as any)
    const { createWriteStream } = await import('fs')
    await pipeline(nodeStream, createWriteStream(outputFile))
  } catch (err) {
    throw new Error(`音频流下载失败: ${(err as Error).message}`)
  }

  return outputFile
}

/**
 * Split an audio file into chunks if it exceeds the Whisper API size limit.
 * Uses ffmpeg to split and convert to mp3. Returns array of chunk file paths.
 */
async function splitAudioIfNeeded(
  filePath: string,
  outputDir: string
): Promise<string[]> {
  const fileStat = await stat(filePath)

  if (fileStat.size <= MAX_FILE_SIZE) {
    // If it's not mp3, convert to mp3 for Whisper compatibility
    if (!filePath.endsWith('.mp3')) {
      const mp3Path = join(outputDir, `${randomUUID()}.mp3`)
      await execAsync(
        `ffmpeg -y -i "${filePath}" -acodec libmp3lame -q:a 5 "${mp3Path}"`,
        { timeout: 120_000 }
      )
      return [mp3Path]
    }
    return [filePath]
  }

  // Get duration using ffprobe
  const { stdout: durationStr } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
  )
  const totalSeconds = parseFloat(durationStr.trim())
  if (isNaN(totalSeconds)) {
    throw new Error('无法获取音频时长，无法分段')
  }

  // Estimate chunk duration based on file size ratio
  const chunkSeconds = Math.floor((MAX_FILE_SIZE / fileStat.size) * totalSeconds * 0.9)
  const chunks: string[] = []
  let start = 0
  let chunkIndex = 0

  while (start < totalSeconds) {
    const chunkPath = join(outputDir, `${randomUUID()}_chunk${chunkIndex}.mp3`)
    await execAsync(
      `ffmpeg -y -i "${filePath}" -ss ${start} -t ${chunkSeconds} -acodec libmp3lame -q:a 5 "${chunkPath}"`,
      { timeout: 120_000 }
    )
    chunks.push(chunkPath)
    start += chunkSeconds
    chunkIndex++
  }

  return chunks
}

/**
 * Transcribe a YouTube video using OpenAI Whisper API.
 *
 * Flow:
 * 1. Download audio via youtubei.js (InnerTube API, no cookies needed)
 * 2. Convert to mp3 and split into chunks if > 25MB (using ffmpeg)
 * 3. Send each chunk to Whisper API
 * 4. Concatenate results
 */
export async function transcribeWithWhisper(
  videoUrl: string
): Promise<WhisperTranscriptionResult | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY 未配置')
  }

  const workDir = join(tmpdir(), 'celepulse-transcription')
  await mkdir(workDir, { recursive: true })

  let audioPath: string | null = null
  let chunkPaths: string[] = []

  try {
    // 1. Download audio via InnerTube API
    audioPath = await downloadAudio(videoUrl, workDir)

    // 2. Convert to mp3 + split if needed
    chunkPaths = await splitAudioIfNeeded(audioPath, workDir)

    // 3. Transcribe each chunk
    const openai = new OpenAI({ apiKey })
    const texts: string[] = []
    let detectedLanguage: string | null = null

    for (const chunkPath of chunkPaths) {
      const audioBuffer = await readFile(chunkPath)
      const file = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' })

      const result = await openai.audio.transcriptions.create({
        file,
        model: 'whisper-1',
        response_format: 'verbose_json',
      })

      texts.push(result.text)
      if (!detectedLanguage && (result as any).language) {
        detectedLanguage = (result as any).language
      }
    }

    return {
      text: texts.join('\n'),
      language: detectedLanguage,
    }
  } finally {
    // 4. Cleanup temp files
    const filesToClean = [audioPath, ...chunkPaths].filter(Boolean) as string[]
    for (const f of filesToClean) {
      try {
        await rm(f, { force: true })
      } catch {
        // ignore cleanup errors
      }
    }
  }
}
