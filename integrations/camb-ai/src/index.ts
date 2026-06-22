import { RuntimeError } from '@botpress/client'
import crypto from 'crypto'
import { createCambClient, pollForResult } from './camb-client'
import * as bp from '.botpress'

const CAMB_AI_BASE_URL = 'https://client.camb.ai'
const SECONDS_IN_A_DAY = 24 * 60 * 60

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    generateSpeech: async ({ input, client }) => {
      const cambClient = createCambClient(bp.secrets.CAMB_AI_API_KEY)

      const response = await cambClient.textToSpeech.tts({
        text: input.text,
        voice_id: input.voiceId ?? 147320,
        language: (input.language ?? 'en-us') as any,
        speech_model: (input.model ?? 'mars-flash') as any,
        user_instructions: input.instructions,
      })

      const audioBuffer = await response.arrayBuffer()

      const expiresAt = input.expiration
        ? new Date(Date.now() + input.expiration * SECONDS_IN_A_DAY * 1000).toISOString()
        : undefined

      const { file } = await client.uploadFile({
        key: generateFileKey('camb-ai-generateSpeech-', input, '.wav'),
        content: audioBuffer,
        accessPolicies: ['public_content'],
        publicContentImmediatelyAccessible: true,
        tags: {
          source: 'integration',
          integration: 'camb-ai',
          action: 'generateSpeech',
        },
        expiresAt,
      })

      return {
        audioUrl: file.url,
      }
    },

    listVoices: async ({}) => {
      const cambClient = createCambClient(bp.secrets.CAMB_AI_API_KEY)
      const voicesList = await cambClient.voiceCloning.listVoices()

      const voices = voicesList.map((v: any) => ({
        id: v.id ?? 0,
        name: v.voice_name ?? '',
        gender: v.gender ?? null,
        language: v.language ?? null,
        description: v.description ?? null,
      }))

      return { voices }
    },

    translateText: async ({ input }) => {
      const cambClient = createCambClient(bp.secrets.CAMB_AI_API_KEY)

      const createResult = (await cambClient.translation.createTranslation({
        texts: [input.text],
        source_language: input.sourceLanguage,
        target_language: input.targetLanguage,
      })) as any

      const taskId = createResult.task_id
      if (!taskId) {
        throw new RuntimeError('CAMB AI did not return a task_id for translation')
      }

      const translationResult = await pollForResult(
        async () => {
          const status = await cambClient.translation.getTranslationTaskStatus({ task_id: taskId })
          return { status: status.status, run_id: status.run_id }
        },
        async (runId: number) => {
          return cambClient.translation.getTranslationResult({ run_id: runId })
        }
      )

      return {
        translatedText: translationResult.texts?.[0] ?? '',
      }
    },

    translatedTts: async ({ input, client }) => {
      const cambClient = createCambClient(bp.secrets.CAMB_AI_API_KEY)

      const createResult = await cambClient.translatedTts.createTranslatedTts({
        text: input.text,
        voice_id: input.voiceId,
        source_language: input.sourceLanguage,
        target_language: input.targetLanguage,
      })

      const taskId = createResult.task_id
      if (!taskId) {
        throw new RuntimeError('CAMB AI did not return a task_id for translated TTS')
      }

      const runId = await pollForResult(
        async () => {
          const status = await cambClient.translatedTts.getTranslatedTtsTaskStatus({ task_id: taskId })
          return { status: status.status, run_id: status.run_id }
        },
        async (rid: number) => rid
      )

      // Get translation result
      const translationResult = await cambClient.translation.getTranslationResult({ run_id: runId })
      const translatedText = translationResult.texts?.[0] ?? ''

      // Fetch TTS audio via direct API call (raw bytes, no output_type param)
      const audioResponse = await fetch(`${CAMB_AI_BASE_URL}/apis/tts-result/${runId}`, {
        headers: { 'x-api-key': bp.secrets.CAMB_AI_API_KEY },
      })
      if (!audioResponse.ok) {
        throw new RuntimeError(`Failed to fetch translated TTS audio: ${audioResponse.statusText}`)
      }

      const expiresAt = input.expiration
        ? new Date(Date.now() + input.expiration * SECONDS_IN_A_DAY * 1000).toISOString()
        : undefined

      const { file } = await client.uploadFile({
        key: generateFileKey('camb-ai-translatedTts-', input, '.wav'),
        content: await audioResponse.arrayBuffer(),
        accessPolicies: ['public_content'],
        publicContentImmediatelyAccessible: true,
        tags: {
          source: 'integration',
          integration: 'camb-ai',
          action: 'translatedTts',
        },
        expiresAt,
      })

      return {
        audioUrl: file.url,
        translatedText,
      }
    },

    cloneVoice: async ({ input }) => {
      const cambClient = createCambClient(bp.secrets.CAMB_AI_API_KEY)

      // Download the audio file
      const audioResponse = await fetch(input.audioFileUrl)
      if (!audioResponse.ok) {
        throw new RuntimeError(`Failed to download audio file: ${audioResponse.statusText}`)
      }
      const audioBlob = await audioResponse.blob()

      const result = await cambClient.voiceCloning.createCustomVoice({
        file: audioBlob,
        voice_name: input.voiceName,
        gender: input.gender,
        language: input.language,
        enhance_audio: input.enhanceAudio,
      })

      return {
        voiceId: result.voice_id,
      }
    },
  },
  channels: {},
  handler: async () => {},
})

function generateFileKey(prefix: string, input: object, suffix?: string) {
  const json = JSON.stringify(input)
  const hash = crypto.createHash('sha1')

  hash.update(json)
  const hexHash = hash.digest('hex')

  return prefix + hexHash + suffix
}
