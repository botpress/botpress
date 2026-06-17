import 'dotenv/config'
import { describe, test, expect, beforeAll } from 'vitest'
import { CognitiveBeta, CognitiveStreamChunk, TtsStreamChunk } from '../src/cognitive-v2'

const apiUrl = process.env.COGNITIVE_API_URL ?? process.env.CLOUD_API_ENDPOINT ?? 'https://api.botpress.dev'
const botId = process.env.CLOUD_BOT_ID
const token = process.env.CLOUD_PAT

const hasCreds = !!botId && !!token

describe.skipIf(!hasCreds)('CognitiveBeta e2e — TTS', () => {
  let beta: CognitiveBeta

  beforeAll(async () => {
    beta = new CognitiveBeta({ apiUrl, botId, token, timeout: 120_000 })

    // The first TTS request against a freshly-created bot is a cold start that can
    // exceed the client's per-request timeout. Warm the path once here (tolerating
    // failure) so the assertions below run against a warm backend instead of racing
    // the cold-start latency.
    await beta.generateAudio({ model: 'openai:tts-1', input: 'warmup', voice: 'alloy', format: 'mp3' }).catch(() => {})
  }, 150_000)

  test('listVoices returns a non-empty array of well-formed voices', async () => {
    const voices = await beta.listVoices()
    expect(Array.isArray(voices)).toBe(true)
    expect(voices.length).toBeGreaterThan(0)

    const v = voices[0]!
    expect(typeof v.id).toBe('string')
    expect(typeof v.displayName).toBe('string')
    expect(typeof v.provider).toBe('string')
    expect(Array.isArray(v.models)).toBe(true)
  }, 30_000)

  test('listVoices honors the model filter', async () => {
    const voices = await beta.listVoices({ model: 'openai:tts-1' })
    expect(voices.length).toBeGreaterThan(0)
    for (const v of voices) {
      expect(v.provider).toBe('openai')
      expect(v.models).toContain('tts-1')
    }
  }, 30_000)

  test('generateAudio returns a playable audio URL', async () => {
    const res = await beta.generateAudio({
      model: 'openai:tts-1',
      input: 'Hello world.',
      voice: 'alloy',
      format: 'mp3',
    })

    expect(res.output.audioUrl).toMatch(/^https?:\/\//)
    expect(res.metadata.provider).toBe('openai')
    expect(res.metadata.model).toContain('tts-1')
    expect(res.metadata.voice).toBe('alloy')
    expect(res.metadata.format).toBe('mp3')
    expect(res.metadata.characterCount).toBe('Hello world.'.length)
    expect(res.metadata.cost).toBeGreaterThanOrEqual(0)
  }, 60_000)

  test('generateAudioStream yields chunks ending with a finished chunk', async () => {
    const chunks: TtsStreamChunk[] = []
    for await (const chunk of beta.generateAudioStream({
      model: 'openai:tts-1',
      input: 'Streaming test.',
      voice: 'alloy',
      format: 'mp3',
    })) {
      chunks.push(chunk)
    }

    expect(chunks.length).toBeGreaterThan(0)

    // Intermediate audio chunks are provider-dependent — some providers stream raw audio bytes,
    // others (e.g. openai:tts-1) only emit the final chunk with the hosted URL.
    const audioChunks = chunks.filter((c): c is Extract<TtsStreamChunk, { finished: false }> => c.finished === false)
    for (const c of audioChunks) {
      expect(typeof c.audio).toBe('string')
      expect(c.audio.length).toBeGreaterThan(0)
    }

    const final = chunks[chunks.length - 1]!
    expect(final.finished).toBe(true)
    if (final.finished) {
      expect(final.audioUrl).toMatch(/^https?:\/\//)
      expect(final.metadata.provider).toBe('openai')
      expect(final.metadata.characterCount).toBe('Streaming test.'.length)
    }
  }, 90_000)
})

describe.skipIf(!hasCreds)('CognitiveBeta e2e — Text generation', () => {
  let beta: CognitiveBeta

  beforeAll(() => {
    beta = new CognitiveBeta({ apiUrl, botId, token, timeout: 120_000 })
  })

  test('generateText returns output and usage metadata', async () => {
    const res = await beta.generateText({
      messages: [{ role: 'user', content: 'Reply with exactly: pong' }],
      model: 'auto',
      maxTokens: 500,
    })

    expect(typeof res.output).toBe('string')
    expect(res.output.length).toBeGreaterThan(0)
    expect(res.metadata.provider).toBeTruthy()
    expect(typeof res.metadata.model).toBe('string')
    expect(res.metadata.usage.inputTokens).toBeGreaterThan(0)
    expect(res.metadata.usage.outputTokens).toBeGreaterThan(0)
    expect(res.metadata.cost).toBeGreaterThanOrEqual(0)
  }, 60_000)

  test('generateTextStream yields chunks and ends with metadata', async () => {
    const chunks: CognitiveStreamChunk[] = []
    for await (const chunk of beta.generateTextStream({
      messages: [{ role: 'user', content: 'Count from 1 to 3, one per line.' }],
      model: 'auto',
      maxTokens: 500,
    })) {
      chunks.push(chunk)
    }

    expect(chunks.length).toBeGreaterThan(0)

    const aggregated = chunks.map((c) => c.output ?? '').join('')
    expect(aggregated.length).toBeGreaterThan(0)

    const final = chunks[chunks.length - 1]!
    expect(final.metadata).toBeDefined()
    expect(final.metadata?.provider).toBeTruthy()
    expect(typeof final.metadata?.model).toBe('string')
  }, 90_000)
})

describe.skipIf(!hasCreds)('CognitiveBeta e2e — Transcription', () => {
  let beta: CognitiveBeta
  let audioUrl: string

  beforeAll(async () => {
    beta = new CognitiveBeta({ apiUrl, botId, token, timeout: 120_000 })

    const audio = await beta.generateAudio({
      model: 'openai:tts-1',
      input: 'The quick brown fox jumps over the lazy dog.',
      voice: 'alloy',
      format: 'mp3',
    })

    if (!audio.output.audioUrl) {
      throw new Error('generateAudio returned no audioUrl; cannot run transcription e2e')
    }
    audioUrl = audio.output.audioUrl
    // This block uses its own client instance, so it pays the TTS cold start again
    // (warming the TTS describe block does not warm this one). Allow enough budget
    // for the client's internal retries to ride out a cold backend.
  }, 150_000)

  test('transcribeAudio returns text and metadata', async () => {
    const res = await beta.transcribeAudio({
      url: audioUrl,
      model: 'fast',
      options: { skipCache: true },
    })

    expect(typeof res.output).toBe('string')
    expect(res.output.length).toBeGreaterThan(0)
    expect(res.metadata.provider).toBeTruthy()
    expect(typeof res.metadata.model).toBe('string')
    expect(res.metadata.durationSeconds).toBeGreaterThan(0)
    expect(res.metadata.cost).toBeGreaterThanOrEqual(0)
  }, 90_000)
})

describe.skipIf(!hasCreds)('CognitiveBeta e2e — Models', () => {
  let beta: CognitiveBeta

  beforeAll(() => {
    beta = new CognitiveBeta({ apiUrl, botId, token, timeout: 60_000 })
  })

  test('listModels returns a non-empty array of well-formed models', async () => {
    const models = await beta.listModels()
    expect(Array.isArray(models)).toBe(true)
    expect(models.length).toBeGreaterThan(0)

    const m = models[0]!
    expect(typeof m.id).toBe('string')
    expect(typeof m.name).toBe('string')
    expect(typeof m.description).toBe('string')
    expect(typeof m.input.maxTokens).toBe('number')
    expect(typeof m.input.costPer1MTokens).toBe('number')
    expect(typeof m.output.maxTokens).toBe('number')
    expect(typeof m.output.costPer1MTokens).toBe('number')
    expect(Array.isArray(m.tags)).toBe(true)
    expect(['production', 'preview', 'deprecated', 'discontinued']).toContain(m.lifecycle)
  }, 30_000)
})

describe.skipIf(!hasCreds)('CognitiveBeta e2e — Image generation', () => {
  let beta: CognitiveBeta

  beforeAll(() => {
    beta = new CognitiveBeta({ apiUrl, botId, token, timeout: 180_000 })
  })

  test('generateImage returns a hosted image URL with sensible metadata', async () => {
    const res = await beta.generateImage({
      model: 'fast',
      prompt: 'A solid red circle on a white background, minimal flat illustration.',
      size: '1024x1024',
      quality: 'low',
      format: 'png',
    })

    expect(res.output.imageUrl).toMatch(/^https?:\/\//)
    expect(typeof res.metadata.provider).toBe('string')
    expect(res.metadata.provider.length).toBeGreaterThan(0)
    expect(typeof res.metadata.model).toBe('string')
    expect(res.metadata.format).toBe('png')
    expect(typeof res.metadata.size).toBe('string')
    expect(res.metadata.size.length).toBeGreaterThan(0)
    expect(res.metadata.cost).toBeGreaterThanOrEqual(0)
  }, 180_000)

  test('generateImage emits request and response events', async () => {
    const events: string[] = []
    const offReq = beta.on('request', (req) => events.push(`request:${req.type}`))
    const offRes = beta.on('response', (req) => events.push(`response:${req.type}`))

    try {
      await beta.generateImage({
        model: 'fast',
        prompt: 'A blue square on a white background.',
        size: '1024x1024',
        quality: 'low',
        format: 'png',
      })

      expect(events).toContain('request:generateImage')
      expect(events).toContain('response:generateImage')
    } finally {
      offReq()
      offRes()
    }
  }, 180_000)
})
