import { IntegrationDefinition, z } from '@botpress/sdk'
import { scheduleEventInputSchema, scheduleEventOutputSchema } from 'definitions/actions'
import { inviteeEventOutputSchema } from 'definitions/events'

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
      description: 'Generates a link for scheduling an event in Calendly',
      input: { schema: scheduleEventInputSchema },
      output: { schema: scheduleEventOutputSchema },
    },
  },
  events: {
    eventScheduled: {
      title: 'Event Scheduled',
      description: 'An event that triggers when an invitee fills out and submits a scheduling form',
      schema: inviteeEventOutputSchema,
    },
    eventCanceled: {
      title: 'Event Canceled',
      description: 'An event that triggers when an invitee cancels a scheduled event',
      schema: inviteeEventOutputSchema,
    },
    eventNoShowCreated: {
      title: 'Event No Show Created',
      description: 'An event that triggers when an invitee is marked as a no-show',
      schema: inviteeEventOutputSchema,
    },
    eventNoShowDeleted: {
      title: 'Event No Show Deleted',
      description: 'An event that triggers when an invitee is unmarked as a no-show',
      schema: inviteeEventOutputSchema,
    },
  },
})
