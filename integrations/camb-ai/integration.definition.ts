import { IntegrationDefinition, z } from '@botpress/sdk'

const TtsModels = ['mars-flash', 'mars-pro', 'mars-instruct'] as const

export default new IntegrationDefinition({
  name: 'camb-ai',
  title: 'CAMB AI',
  description:
    'Access CAMB AI for ultra-low-latency text-to-speech, text translation, translated TTS, and voice cloning across 140+ languages.',
  version: '1.0.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  secrets: {
    CAMB_AI_API_KEY: {
      description: 'CAMB AI API key from https://studio.camb.ai',
    },
  },
  actions: {
    generateSpeech: {
      title: 'Generate Speech',
      description: 'Generate speech from text using CAMB AI MARS models',
      billable: true,
      cacheable: true,
      input: {
        schema: z.object({
          text: z.string().describe('The text to convert to speech').title('Text'),
          voiceId: z.number().default(147320).describe('The voice ID to use').title('Voice ID'),
          language: z
            .string()
            .default('en-us')
            .describe('BCP-47 language code (e.g. en-us, fr-fr, es-es)')
            .title('Language'),
          model: z
            .enum(TtsModels)
            .optional()
            .placeholder('mars-flash')
            .describe('The MARS model to use')
            .title('Model'),
          speed: z.number().min(0.5).max(2.0).optional().describe('Speech speed (0.5-2.0)').title('Speed'),
          instructions: z
            .string()
            .optional()
            .describe('Instructions for the model (mars-instruct only)')
            .title('Instructions'),
          expiration: z
            .number()
            .int()
            .min(30)
            .max(90)
            .optional()
            .describe(
              'Expiration of the generated audio file in days (30-90). Default is no expiration.'
            )
            .title('Expiration'),
        }),
      },
      output: {
        schema: z.object({
          audioUrl: z.string().describe('URL to the audio file with the generated speech').title('Audio URL'),
          botpress: z
            .object({
              cost: z.number().describe('Cost of the speech generation, in U.S. dollars').title('Cost'),
            })
            .describe('Botpress metadata')
            .title('Botpress'),
        }),
      },
    },
    translateText: {
      title: 'Translate Text',
      description: 'Translate text between languages using CAMB AI',
      billable: true,
      cacheable: true,
      input: {
        schema: z.object({
          text: z.string().describe('The text to translate').title('Text'),
          sourceLanguage: z
            .number()
            .describe('Source language ID (CAMB AI language code)')
            .title('Source Language'),
          targetLanguage: z
            .number()
            .describe('Target language ID (CAMB AI language code)')
            .title('Target Language'),
        }),
      },
      output: {
        schema: z.object({
          translatedText: z.string().describe('The translated text').title('Translated Text'),
        }),
      },
    },
    translatedTts: {
      title: 'Translated TTS',
      description: 'Translate text and generate speech in the target language',
      billable: true,
      cacheable: true,
      input: {
        schema: z.object({
          text: z.string().describe('The text to translate and speak').title('Text'),
          sourceLanguage: z
            .number()
            .describe('Source language ID (CAMB AI language code)')
            .title('Source Language'),
          targetLanguage: z
            .number()
            .describe('Target language ID (CAMB AI language code)')
            .title('Target Language'),
          voiceId: z.number().describe('The voice ID to use for speech').title('Voice ID'),
          expiration: z
            .number()
            .int()
            .min(30)
            .max(90)
            .optional()
            .describe('Expiration of the generated audio file in days (30-90)')
            .title('Expiration'),
        }),
      },
      output: {
        schema: z.object({
          audioUrl: z.string().describe('URL to the audio file with the generated speech').title('Audio URL'),
          translatedText: z.string().describe('The translated text').title('Translated Text'),
          botpress: z
            .object({
              cost: z.number().describe('Cost of the operation, in U.S. dollars').title('Cost'),
            })
            .describe('Botpress metadata')
            .title('Botpress'),
        }),
      },
    },
    cloneVoice: {
      title: 'Clone Voice',
      description: 'Clone a voice from an audio sample (10-30 seconds of clear speech)',
      billable: true,
      cacheable: false,
      input: {
        schema: z.object({
          audioFileUrl: z
            .string()
            .url()
            .describe('URL to the audio file (10-30s of clear speech)')
            .title('Audio File URL'),
          voiceName: z.string().describe('Name for the cloned voice').title('Voice Name'),
          gender: z
            .number()
            .min(1)
            .max(2)
            .describe('Gender of the voice (1=male, 2=female)')
            .title('Gender'),
          language: z.number().optional().describe('Language ID (CAMB AI language code)').title('Language'),
          enhanceAudio: z
            .boolean()
            .default(true)
            .describe('Enable audio enhancement for better quality')
            .title('Enhance Audio'),
        }),
      },
      output: {
        schema: z.object({
          voiceId: z.number().describe('The ID of the cloned voice').title('Voice ID'),
        }),
      },
    },
    listVoices: {
      title: 'List Voices',
      description: 'List all available voices',
      billable: false,
      cacheable: true,
      input: {
        schema: z.object({}),
      },
      output: {
        schema: z.object({
          voices: z
            .array(
              z.object({
                id: z.number().describe('Voice ID').title('ID'),
                name: z.string().describe('Voice name').title('Name'),
                gender: z.number().nullable().describe('Gender (1=male, 2=female)').title('Gender'),
                language: z.number().nullable().describe('Language ID').title('Language'),
                description: z.string().nullable().describe('Voice description').title('Description'),
              })
            )
            .describe('List of available voices')
            .title('Voices'),
        }),
      },
    },
  },
  attributes: {
    category: 'AI Models',
  },
})
