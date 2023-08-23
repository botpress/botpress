import z from 'zod'

import { actions } from './actions'
import { channels } from './channels'

export { actions }
export { channels }

export const configuration = {
  schema: z.object({
    apiKey: z.string().describe('API Key for Trello'),
    token: z.string().describe('API Token for Trello'),
  }),
}

export const states = {}

export const user = {
  tags: {},
}
