import { InterfaceDeclaration } from '../integration/definition'
import z from '../zui'
import { OpenAITranscribeAudioOutputSchema } from './schemas/speech-to-text'

const SpeechModelRefSchema = z.object({
  id: z.string(),
})

const SpeechToTextModelSchema = SpeechModelRefSchema.extend({
  name: z.string(),
  costPerMinute: z.number().describe('Cost per minute of speech transcription, in U.S. dollars'),
})

const TranscribeAudioInputSchema = <TModelRef extends z.ZodSchema>(imageModelRefSchema: TModelRef) =>
  z.object({
    model: imageModelRefSchema.optional().describe('Model to use for speech-to-text transcription (optional)'),
    fileUrl: z
      .string()
      .url()
      .describe(
        'URL of the audio file to transcribe. The URL should return a content-type header in order to detect the audio format. Supported audio formats supported are: mp3, mp4, mpeg, mpga, m4a, wav, webm'
      ),
    language: z
      .string()
      .optional()
      .describe(
        'The language of the input audio (optional). Supplying the input language in ISO-639-1 format will improve accuracy and latency.'
      ),
    prompt: z
      .string()
      .optional()
      .describe(
        "An optional text to guide the model's style or continue a previous audio segment. The prompt should match the audio language."
      ),
    temperature: z
      .number()
      .default(0)
      .optional()
      .describe(
        'The sampling temperature (optional), between 0 and 1. Defaults to 0 (automatic). Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.'
      ),
  })

const TranscribeAudioBaseSchema = TranscribeAudioInputSchema(SpeechModelRefSchema)

const TranscribeAudioOutputSchema = OpenAITranscribeAudioOutputSchema.extend({
  model: z.string().describe('Model name used'),
  cost: z.number().describe('Total cost of this transcription, in U.S. dollars'),
})

export const speechToText = new InterfaceDeclaration({
  name: 'speechToText',
  version: '1.0.0',
  entities: {
    speechToTextModelRef: {
      schema: SpeechModelRefSchema,
    },
  },
  actions: {
    transcribeAudio: {
      input: {
        schema: ({ speechToTextModelRef }) => TranscribeAudioInputSchema(speechToTextModelRef),
      },
      output: {
        schema: () => TranscribeAudioOutputSchema,
      },
    },
    listSpeechToTextModels: {
      input: {
        schema: () => z.object({}),
      },
      output: {
        schema: ({ speechToTextModelRef }) =>
          z.object({
            models: z.array(z.intersection(SpeechToTextModelSchema, speechToTextModelRef)),
          }),
      },
    },
  },
})

export namespace speechToText {
  export type TranscribeAudioInputSchema = z.infer<typeof TranscribeAudioBaseSchema>
  export type TranscribeAudioOutputSchema = z.infer<typeof TranscribeAudioOutputSchema>
  export type SpeechToTextModel = z.infer<typeof SpeechToTextModelSchema>
  export type SpeechToTextModelDetails = Omit<SpeechToTextModel, 'id'>
}
