/**
 * Transcription module — OpenAI Whisper API integration
 *
 * Used as a fallback when YouTube built-in subtitles are unavailable.
 * Uses yt-dlp for audio download (with cookies to bypass YouTube bot detection).
 * Requires: OPENAI_API_KEY env var, ffmpeg + yt-dlp installed on the server.
 * Optional: YOUTUBE_COOKIES_FILE env var (path to Netscape-format cookies file).
 */

import OpenAI from 'openai'
import { exec } from 'child_process'
import { promisify } from 'util'
import { stat, readFile, rm, mkdir, readdir } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'

const execAsync = promisify(exec)

// Whisper API limit: 25MB per file
const MAX_FILE_SIZE = 24 * 1024 * 1024

// Temp directory for audio processing
const WORK_DIR = join(tmpdir(), 'celepulse-transcription')

// Max age for orphaned temp files (30 minutes)
const MAX_FILE_AGE_MS = 30 * 60 * 1000

// Periodic cleanup interval (15 minutes)
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000

/**
 * Wipe the entire work directory. Called on startup and before/after each job.
 */
async function cleanupWorkDir(): Promise<void> {
  try {
    await rm(WORK_DIR, { recursive: true, force: true })
  } catch {
    // ignore cleanup errors
  }
}

/**
 * Remove orphaned files older than MAX_FILE_AGE_MS from the work directory.
 */
async function cleanupStaleFiles(): Promise<void> {
  try {
    const entries = await readdir(WORK_DIR, { withFileTypes: true })
    const now = Date.now()
    for (const entry of entries) {
      try {
        const filePath = join(WORK_DIR, entry.name)
        const stats = await stat(filePath)
        if (now - stats.mtimeMs > MAX_FILE_AGE_MS) {
          await rm(filePath, { recursive: true, force: true })
          console.log(`Cleaned stale temp file: ${entry.name}`)
        }
      } catch {
        // skip individual file errors
      }
    }
  } catch {
    // work dir doesn't exist, nothing to clean
  }
}

// Start periodic cleanup on module load
let cleanupTimer: ReturnType<typeof setInterval> | null = null
function startPeriodicCleanup(): void {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    cleanupStaleFiles().catch(console.error)
  }, CLEANUP_INTERVAL_MS)
  // Don't keep the process alive just for cleanup
  if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref()
  }
}

// Run startup cleanup immediately
startPeriodicCleanup()
cleanupWorkDir().catch(console.error)

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
 * Download audio from a YouTube video using yt-dlp.
 * Uses cookies file if available to bypass YouTube bot detection.
 * Returns the path to the downloaded audio file.
 */
async function downloadAudio(videoUrl: string, outputDir: string): Promise<string> {
  const outputFile = join(outputDir, `${randomUUID()}.m4a`)
  const cookiesFile = process.env.YOUTUBE_COOKIES_FILE || ''
  console.log(`[Transcription] cookies file: ${cookiesFile || '(not configured)'}`)

  // Build yt-dlp command with deno in PATH for PO Token support
  const envPath = `/home/ubuntu/.deno/bin:/usr/local/bin:${process.env.PATH || '/usr/bin'}`
  const cookiesArg = cookiesFile ? `--cookies "${cookiesFile}"` : ''
  const cmd = `PATH="${envPath}" yt-dlp ${cookiesArg} -f "bestaudio[ext=m4a]/bestaudio" -o "${outputFile}" --no-playlist --force-ipv4 "${videoUrl}"`

  try {
    await execAsync(cmd, { timeout: 180_000 }) // 3 minute timeout
  } catch (err) {
    const stderr = (err as any).stderr || ''
    const stdout = (err as any).stdout || ''
    const errMsg = stderr || stdout || (err as Error).message
    if (errMsg.includes('bot') || errMsg.includes('Sign in')) {
      throw new Error('YouTube 拒绝访问（反爬检测），请更新服务器 cookies 文件')
    }
    throw new Error(`yt-dlp 音频下载失败: ${errMsg.substring(0, 300)}`)
  }

  // Verify the file was created
  try {
    await stat(outputFile)
  } catch {
    throw new Error('yt-dlp 未生成音频文件')
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

  const workDir = WORK_DIR
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
    // 4. Cleanup: wipe entire work directory (most robust approach)
    await cleanupWorkDir()
  }
}
