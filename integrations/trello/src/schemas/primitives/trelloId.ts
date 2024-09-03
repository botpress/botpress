import { z } from '@botpress/sdk'

export const TrelloIDSchema = z.string()
export type TrelloID = z.infer<typeof TrelloIDSchema>
