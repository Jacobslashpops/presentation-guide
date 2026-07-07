import { callDeepSeek } from '@/lib/deepseek'

// ===== Types =====

export interface VideoSentimentResult {
  product_mentioned: boolean
  product_sentiment: 'strongly_positive' | 'positive' | 'neutral' | 'negative' | 'strongly_negative'
  recommendation: 'recommend' | 'neutral' | 'not_recommend'
  key_positive_claims: string[]
  key_negative_claims: string[]
  confidence: 'high' | 'medium' | 'low'
  summary: string
  analyzed_at: string
}

export interface CommentSentimentResult extends VideoSentimentResult {
  positive_ratio_estimate: string
  top_positive_themes: string[]
  top_negative_themes: string[]
  controversy_level: 'low' | 'medium' | 'high'
  sample_size: number
}

// ===== Shared Rubric =====

const SHARED_RUBRIC = `You are a sentiment analysis expert evaluating content about products for a brand monitoring platform.
Your analysis must be objective, consistent, and grounded in the rubric below.

RUBRIC — use these EXACT definitions, do not invent your own:

product_sentiment (5-point scale, use the BEST fit):
- "strongly_positive": Extremely enthusiastic, passionate praise. The speaker goes beyond normal
  recommendation — they are genuinely excited, use superlatives, and advocate strongly.
  Signals: "absolutely amazing", "best product I've ever used", "cannot live without", "mind-blowing",
  "everyone needs this", "life-changing", "obsessed"
- "positive": Clearly favorable. Praises features, expresses satisfaction, recommends the product.
  The tone is approving but measured, not ecstatic.
  Signals: "love it", "really impressed", "highly recommend", "worth it", "great product",
  "solid choice", "I'd buy this again"
- "neutral": The speaker objectively describes the product without clear favor or criticism.
  This is a factual review, unboxing, or spec rundown with no strong opinion either way.
  Signals: "it has", "the specs are", "here's what it does", "let me show you", "it comes with"
- "negative": Clearly unfavorable. The speaker complains about issues, expresses disappointment,
  or advises against purchasing. The tone is critical but not vitriolic.
  Signals: "disappointed", "don't buy", "overpriced", "not worth it", "would not recommend",
  "has some real problems", "not great"
- "strongly_negative": Extremely hostile, angry, or dismissive. The speaker uses strong language,
  expresses outrage, or emphatically warns others away from the product.
  Signals: "absolute garbage", "worst purchase ever", "complete waste", "stay away",
  "scam", "do NOT buy this", "I want my money back", "terrible in every way"

IMPORTANT DISTINCTIONS:
- "strongly_positive" vs "positive": Look for superlatives, extreme enthusiasm, and advocacy.
  "I really like it" = positive. "This is the best thing I've ever bought" = strongly_positive.
- "strongly_negative" vs "negative": Look for anger, outrage, or emphatic warnings.
  "It's not great" = negative. "This is garbage and they should be ashamed" = strongly_negative.

recommendation:
- "recommend": The speaker explicitly suggests purchasing, trying, or choosing this product.
  Includes indirect recommendations like "you should check it out" or "I'd get this again."
- "neutral": No clear purchase suggestion either way. The speaker neither recommends nor discourages.
- "not_recommend": The speaker explicitly advises against purchasing or choosing this product.

confidence:
- "high": Clear, unambiguous sentiment signals throughout the content. Multiple consistent indicators.
- "medium": Some sentiment signals present but not fully conclusive. Limited content or mixed signals.
- "low": Insufficient content to determine reliably, or the content does not discuss any product at all.

KEY RULES:
1. If the content does not mention or discuss any product, set product_mentioned to false and
   product_sentiment to "neutral" with confidence "low".
2. Extract at most 5 key positive claims and 5 key negative claims. Each claim should be a short,
   specific statement (not a paragraph).
3. The summary should be 1-3 sentences capturing the overall sentiment finding.
4. Be consistent: the same content should always produce the same result.`

// ===== Calibration Examples =====

const CALIBRATION_EXAMPLES = `

CALIBRATION EXAMPLES (use these as anchors for consistent scoring):

--- EXAMPLE 1: Strongly Positive ---
Input: "These smart glasses are honestly a game changer. The electrochromic tint adjustment is so
smooth, you can go from clear to dark in seconds. I've been wearing them for a week and the build
quality feels premium. The battery lasts all day. My only gripe is the price tag, but honestly
for what you get it's worth every penny. If you're looking for smart glasses, just get these.
Seriously, I cannot recommend them enough."
Output:
{
  "product_mentioned": true,
  "product_sentiment": "strongly_positive",
  "recommendation": "recommend",
  "key_positive_claims": ["electrochromic tint adjustment is smooth", "premium build quality", "battery lasts all day", "worth the price"],
  "key_negative_claims": ["high price tag"],
  "confidence": "high",
  "summary": "The speaker is extremely enthusiastic about the product, using superlatives and strong advocacy language. Despite noting the high price, they emphatically recommend purchasing."
}

--- EXAMPLE 2: Neutral ---
Input: "Today we're unboxing the SmartView Pro glasses. In the box you get the glasses, a charging
case, and a microfiber cloth. The glasses weigh 42 grams and have a USB-C charging port. They
support Bluetooth 5.2 and have a 4-hour battery life according to the specs. The frame is made of
TR90 nylon. Let me show you how the tint adjustment works."
Output:
{
  "product_mentioned": true,
  "product_sentiment": "neutral",
  "recommendation": "neutral",
  "key_positive_claims": [],
  "key_negative_claims": [],
  "confidence": "high",
  "summary": "The speaker objectively describes the product's specifications and contents without expressing personal opinion or making a purchase recommendation."
}

--- EXAMPLE 3: Strongly Negative ---
Input: "I really wanted to like these glasses but they're a complete disappointment. The tint
adjustment is laggy and inconsistent, the battery died after just 2 hours of use, and the frame
feels cheap and creaky. At $300 this is an absolute ripoff. Save your money and look at the
competition instead. I'm returning mine. Honestly this is garbage and they should be ashamed
of selling this to people."
Output:
{
  "product_mentioned": true,
  "product_sentiment": "strongly_negative",
  "recommendation": "not_recommend",
  "key_positive_claims": [],
  "key_negative_claims": ["laggy and inconsistent tint adjustment", "battery died after 2 hours", "cheap and creaky frame", "overpriced at $300", "called it garbage"],
  "confidence": "high",
  "summary": "The speaker is extremely hostile toward the product, citing multiple failures and using strong language like 'garbage' and 'ripoff'. They emphatically warn others away and plan to return the product."
}`

// ===== Video Sentiment Analysis =====

const VIDEO_SYSTEM_PROMPT = `${SHARED_RUBRIC}
${CALIBRATION_EXAMPLES}

You will be given a video's transcription text and its title.
Analyze the CREATOR's (speaker's) sentiment toward any product discussed.

OUTPUT FORMAT — return ONLY a JSON object with these exact fields:
{
  "product_mentioned": boolean,
  "product_sentiment": "strongly_positive" | "positive" | "neutral" | "negative" | "strongly_negative",
  "recommendation": "recommend" | "neutral" | "not_recommend",
  "key_positive_claims": string[],
  "key_negative_claims": string[],
  "confidence": "high" | "medium" | "low",
  "summary": string
}`

/**
 * Analyze the creator's sentiment toward the product based on video transcription.
 */
export async function analyzeVideoSentiment(
  transcription: string,
  videoTitle: string
): Promise<VideoSentimentResult> {
  const userContent = `Video Title: ${videoTitle}\n\nTranscription:\n${transcription}`

  const raw = await callDeepSeek(VIDEO_SYSTEM_PROMPT, userContent, {
    temperature: 0.1,
    maxTokens: 2048,
  })

  const parsed = JSON.parse(raw)

  // Validate and normalize
  const result: VideoSentimentResult = {
    product_mentioned: parsed.product_mentioned ?? false,
    product_sentiment: validateEnum(parsed.product_sentiment, ['strongly_positive', 'positive', 'neutral', 'negative', 'strongly_negative'], 'neutral'),
    recommendation: validateEnum(parsed.recommendation, ['recommend', 'neutral', 'not_recommend'], 'neutral'),
    key_positive_claims: ensureStringArray(parsed.key_positive_claims, 5),
    key_negative_claims: ensureStringArray(parsed.key_negative_claims, 5),
    confidence: validateEnum(parsed.confidence, ['high', 'medium', 'low'], 'medium'),
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    analyzed_at: new Date().toISOString(),
  }

  return result
}

// ===== Comment Sentiment Analysis =====

const COMMENT_SYSTEM_PROMPT = `${SHARED_RUBRIC}
${CALIBRATION_EXAMPLES}

You will be given a collection of viewer comments on a video, sorted by popularity (likes).
Analyze the OVERALL AUDIENCE sentiment toward any product discussed in the video.

IMPORTANT GUIDELINES FOR COMMENT ANALYSIS:
1. Weight comments by their like counts — highly liked comments represent more viewers' opinions.
2. Ignore spam, off-topic, and non-substantive comments (e.g., "first", "nice", emoji-only).
3. Focus on comments that express opinions about the product, not about the creator personally.
4. Consider the ratio of positive vs negative sentiment-bearing comments.

OUTPUT FORMAT — return ONLY a JSON object with these exact fields:
{
  "product_mentioned": boolean,
  "product_sentiment": "strongly_positive" | "positive" | "neutral" | "negative" | "strongly_negative",
  "recommendation": "recommend" | "neutral" | "not_recommend",
  "key_positive_claims": string[],
  "key_negative_claims": string[],
  "confidence": "high" | "medium" | "low",
  "summary": string,
  "positive_ratio_estimate": string,
  "top_positive_themes": string[],
  "top_negative_themes": string[],
  "controversy_level": "low" | "medium" | "high",
  "sample_size": number
}

Field definitions:
- positive_ratio_estimate: Rough percentage of product-related comments that are positive (e.g., "70-80%")
- top_positive_themes: Recurring positive topics (max 5)
- top_negative_themes: Recurring negative topics (max 5)
- controversy_level: "low" if comments are mostly aligned, "medium" if split, "high" if strongly polarized
- sample_size: Total number of comments analyzed (excluding spam/off-topic)`

/**
 * Analyze audience sentiment based on video comments.
 */
export async function analyzeCommentSentiment(
  comments: Array<{ text: string; like_count: number }>,
  videoTitle: string
): Promise<CommentSentimentResult> {
  // Sort by likes descending, take top 100
  const topComments = comments
    .sort((a, b) => b.like_count - a.like_count)
    .slice(0, 100)

  // Format comments with like counts for context
  const formattedComments = topComments
    .map((c, i) => `[${i + 1}] (${c.like_count} likes) ${c.text}`)
    .join('\n\n')

  const userContent = `Video Title: ${videoTitle}\n\nTop Comments (${topComments.length} total):\n${formattedComments}`

  const raw = await callDeepSeek(COMMENT_SYSTEM_PROMPT, userContent, {
    temperature: 0.1,
    maxTokens: 4096,
  })

  const parsed = JSON.parse(raw)

  // Validate and normalize
  const result: CommentSentimentResult = {
    product_mentioned: parsed.product_mentioned ?? false,
    product_sentiment: validateEnum(parsed.product_sentiment, ['strongly_positive', 'positive', 'neutral', 'negative', 'strongly_negative'], 'neutral'),
    recommendation: validateEnum(parsed.recommendation, ['recommend', 'neutral', 'not_recommend'], 'neutral'),
    key_positive_claims: ensureStringArray(parsed.key_positive_claims, 5),
    key_negative_claims: ensureStringArray(parsed.key_negative_claims, 5),
    confidence: validateEnum(parsed.confidence, ['high', 'medium', 'low'], 'medium'),
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    positive_ratio_estimate: typeof parsed.positive_ratio_estimate === 'string' ? parsed.positive_ratio_estimate : 'N/A',
    top_positive_themes: ensureStringArray(parsed.top_positive_themes, 5),
    top_negative_themes: ensureStringArray(parsed.top_negative_themes, 5),
    controversy_level: validateEnum(parsed.controversy_level, ['low', 'medium', 'high'], 'medium'),
    sample_size: typeof parsed.sample_size === 'number' ? parsed.sample_size : topComments.length,
    analyzed_at: new Date().toISOString(),
  }

  return result
}

// ===== Helpers =====

function validateEnum<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  if (typeof value === 'string' && allowed.includes(value as T)) {
    return value as T
  }
  return fallback
}

function ensureStringArray(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .slice(0, maxItems)
    .map((item) => item.trim())
}
