import { z } from '@botpress/sdk'

export const OpenAITranscribeAudioOutputSchema = z.object({
  language: z.string().describe('Detected language of the audio'),
  duration: z.number().describe('Duration of the audio file, in seconds'),
  segments: z.array(
    z.object({
      text: z.string().describe('Text content of the segment.'),
      id: z.number().describe('Unique identifier of the segment'),
      seek: z.number().describe('Seek offset of the segment'),
      start: z.number().describe('Start time of the segment in seconds.'),
      end: z.number().describe('End time of the segment in seconds.'),
      tokens: z.array(z.number()).describe('Array of token IDs for the text content.'),
      temperature: z.number().describe('Temperature parameter used for generating the segment.'),
      avg_logprob: z
        .number()
        .describe('Average logprob of the segment. If the value is lower than -1, consider the logprobs failed.'),
      compression_ratio: z
        .number()
        .describe(
          'Compression ratio of the segment. If the value is greater than 2.4, consider the compression failed.'
        ),
      no_speech_prob: z
        .number()
        .describe(
          'Probability of no speech in the segment. If the value is higher than 1.0 and the avg_logprob is below -1, consider this segment silent.'
        ),
    })
  ),
})

export const SpeechModelRefSchema = z.object({
  id: z.string(),
})

export const SpeechToTextModelSchema = SpeechModelRefSchema.extend({
  name: z.string(),
  costPerMinute: z.number().describe('Cost per minute of speech transcription, in U.S. dollars'),
})

export const TranscribeAudioInputSchema = <TModelRef extends z.ZodSchema>(imageModelRefSchema: TModelRef) =>
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

export const TranscribeAudioBaseSchema = TranscribeAudioInputSchema(SpeechModelRefSchema)

export const TranscribeAudioOutputSchema = OpenAITranscribeAudioOutputSchema.extend({
  model: z.string().describe('Model name used'),
  cost: z.number().describe('Total cost of the transcription, in U.S. dollars (DEPRECATED)'),
  botpress: z.object({
    cost: z.number().describe('Total cost of the transcription, in U.S. dollars'),
  }),
})
