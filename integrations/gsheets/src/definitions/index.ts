import type { IntegrationDefinitionProps } from '@botpress/sdk'
import z from 'zod'

import { actions } from './actions'
import { channels } from './channels'

export { actions }
export { channels }

export const configuration = {
  schema: z.object({
    spreadsheetId: z
      .string()
      .describe('The ID of the Google Spreadsheet to interact with'),
    privateKey: z
      .string()
      .describe('The private key from the Google service account'),
    clientEmail: z
      .string()
      .email()
      .describe('The client email from the Google service account'),
  }),
}

export const states: IntegrationDefinitionProps['states'] = {}

export const user = {
  tags: { id: {} },
  creation: { enabled: true, requiredTags: ['id'] },
}
