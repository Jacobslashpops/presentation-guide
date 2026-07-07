import OpenAI from 'openai'

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_API_URL || 'https://api.sandboxcrew.ai/v1'
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro'

function createClient(): OpenAI {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY is not configured')
  }
  return new OpenAI({
    baseURL: DEEPSEEK_BASE_URL,
    apiKey: DEEPSEEK_API_KEY,
  })
}

export interface DeepSeekOptions {
  temperature?: number
  maxTokens?: number
}

/**
 * Call DeepSeek API with a system prompt and user content.
 * Forces JSON output via response_format.
 * Returns the raw JSON string from the model.
 */
export async function callDeepSeek(
  systemPrompt: string,
  userContent: string,
  options?: DeepSeekOptions
): Promise<string> {
  const client = createClient()

  const response = await client.chat.completions.create({
    model: DEEPSEEK_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: options?.temperature ?? 0.1,
    max_tokens: options?.maxTokens ?? 4096,
    stream: false,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('DeepSeek returned empty response')
  }

  return content
}
