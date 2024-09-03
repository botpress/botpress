import { z } from '@botpress/sdk'

export const TrelloIDSchema = z.string().nullable()
export const OutputMessageSchema = z.string().describe('Output message')

export * as actionSchema from './actions'
export * from './configuration'
