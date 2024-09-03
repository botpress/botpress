import { z } from '@botpress/sdk'

export { TrelloIDSchema } from './primitives/trelloId'
export type { TrelloID } from './primitives/trelloId'

export const OutputMessageSchema = z.string().describe('Output message')

export * as actionSchema from './actions'
export * from './configuration'
