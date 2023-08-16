import { z } from 'zod'
import * as botpress from '.botpress'

const teams = new botpress.teams.Teams()
const zendesk = new botpress.zendesk.Zendesk()

export const bot = new botpress.Bot({
  integrations: {
    teams,
    zendesk,
  },
  configuration: {
    schema: z.object({}),
  },
  states: {
    flow: {
      type: 'conversation',
      schema: z.object({
        hitlEnabled: z.boolean(),
      }),
      ui: {
        hitlEnabled: {
          title: 'HITL Enabled',
          examples: [true, false],
        },
      },
    },
  },
  events: {},
  recurringEvents: {},
})
