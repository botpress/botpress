import { z } from '@botpress/sdk'
import * as schemas from './schemas'

export type GenerateContentInput = z.infer<typeof schemas.GenerateContentInputBaseSchema>
export type GenerateContentOutput = z.infer<typeof schemas.GenerateContentOutputSchema>
export type ToolCall = z.infer<typeof schemas.ToolCallSchema>
export type Message = z.infer<typeof schemas.MessageSchema>
export type Model = z.infer<typeof schemas.ModelSchema>
export type ModelDetails = Omit<Model, 'id'>
