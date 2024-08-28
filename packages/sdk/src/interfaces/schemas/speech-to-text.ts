import z from '../../zui'

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
