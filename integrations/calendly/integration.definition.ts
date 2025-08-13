import { IntegrationDefinition, z } from '@botpress/sdk'
import { scheduleEventInputSchema, scheduleEventOutputSchema } from 'definitions/actions'

export default new IntegrationDefinition({
  name: 'calendly',
  title: 'Calendly',
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  description: 'Schedule meetings and manage events using the Calendly scheduling platform.',
  configuration: {
    schema: z.object({
      accessToken: z
        .string()
        .secret()
        .min(1)
        .describe('Your Calendly Personal Access Token')
        .title('Personal Access Token'),
    }),
  },
  actions: {
    scheduleEvent: {
      title: 'Schedule Calendly Event',
      description: 'Schedules a new event in Calendly',
      input: { schema: scheduleEventInputSchema },
      output: { schema: scheduleEventOutputSchema },
    },
  },
})
