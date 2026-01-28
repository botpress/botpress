import { z } from '@botpress/sdk'

export const OpenAITranscribeAudioOutputSchema = z.object({
  language: z.string().title('Detected Language').describe('Detected language of the audio'),
  duration: z.number().title('Audio Duration').describe('Duration of the audio file, in seconds'),
  segments: z
    .array(
      z.object({
        text: z.string().title('Segment Text Content').describe('Text content of the segment.'),
        id: z.number().title('Segment ID').describe('Unique identifier of the segment'),
        seek: z.number().title('Seek Offset').describe('Seek offset of the segment'),
        start: z.number().title('Segment Start Time').describe('Start time of the segment in seconds.'),
        end: z.number().title('Segment End Time').describe('End time of the segment in seconds.'),
        tokens: z.array(z.number()).title('Text Token IDs').describe('Array of token IDs for the text content.'),
        temperature: z.number().title('Temperature').describe('Temperature parameter used for generating the segment.'),
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
    )
    .title('Transcription Segments')
    .describe('List of transcription segments'),
})

export const SpeechModelRefSchema = z.object({
  id: z.string().title('Model ID').describe('Unique identifier of the speech-to-text model'),
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
      .title('Audio File URL')
      .describe(
        'URL of the audio file to transcribe. The URL should return a content-type header in order to detect the audio format. Supported audio formats supported are: mp3, mp4, mpeg, mpga, m4a, wav, webm'
      ),
    language: z
      .string()
      .optional()
      .title('Audio Language')
      .describe(
        'The language of the input audio (optional). Supplying the input language in ISO-639-1 format will improve accuracy and latency.'
      ),
    prompt: z
      .string()
      .optional()
      .title('Transcription Prompt')
      .describe(
        "An optional text to guide the model's style or continue a previous audio segment. The prompt should match the audio language."
      ),
    temperature: z
      .number()
      .default(0)
      .optional()
      .title('Temperature')
      .describe(
        'The sampling temperature (optional), between 0 and 1. Defaults to 0 (automatic). Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.'
      ),
  })

export const TranscribeAudioBaseSchema = TranscribeAudioInputSchema(SpeechModelRefSchema)

export const TranscribeAudioOutputSchema = OpenAITranscribeAudioOutputSchema.extend({
  model: z.string().title('AI Model Name').describe('Model name used'),
  cost: z
    .number()
    .title('Transcription Cost')
    .describe('Total cost of the transcription, in U.S. dollars (DEPRECATED)'),
  botpress: z
    .object({
      cost: z.number().title('Transcription Cost').describe('Total cost of the transcription, in U.S. dollars'),
    })
    .title('Botpress Metadata')
    .describe('Metadata added by Botpress'),
})
