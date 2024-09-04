import { z } from '@botpress/sdk'

export const trelloIdRegex = /[0-9a-fA-F]{24}/

export const TrelloIDSchema = z
  .string()
  .length(24)
  .regex(new RegExp(`^${trelloIdRegex.source}$`))

export type TrelloID = z.infer<typeof TrelloIDSchema>
