import { z } from '@botpress/sdk'
import * as schemas from './schemas'

export type TranscribeAudioInputSchema = z.infer<typeof schemas.TranscribeAudioBaseSchema>
export type TranscribeAudioOutputSchema = z.infer<typeof schemas.TranscribeAudioOutputSchema>
export type SpeechToTextModel = z.infer<typeof schemas.SpeechToTextModelSchema>
export type SpeechToTextModelDetails = Omit<SpeechToTextModel, 'id'>
export type TranscribeAudioInput = TranscribeAudioInputSchema
export type TranscribeAudioOutput = TranscribeAudioOutputSchema
