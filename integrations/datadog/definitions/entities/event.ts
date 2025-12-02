import { z } from '@botpress/sdk'

export namespace Event {
  export const schema = z
    .object({
      id: z.number().title('Event ID').optional().describe('ID of the event.'),
      title: z.string().title('Title').describe('Title of the event.'),
      text: z.string().title('Text').describe('Text body of the event.'),
      dateHappened: z.number().title('Date Happened').optional().describe('POSIX timestamp of the event.'),
      handle: z.string().title('Handle').optional().describe('Handle of the user who posted the event.'),
      relatedEventId: z.number().title('Related Event ID').optional().describe('ID of the parent event.'),
      tags: z.array(z.string()).title('Tags').optional().describe('Array of tags associated with the event.'),
      url: z.string().title('URL').optional().describe('URL of the event.'),
      priority: z
        .enum(['normal', 'low'])
        .title('Priority')
        .optional()
        .describe('Priority of the event.'),
      source: z
        .enum(['nagios', 'hudson', 'jenkins', 'user', 'my apps', 'feed', 'chef', 'puppet', 'git', 'bitbucket', 'fabric', 'capistrano'])
        .title('Source')
        .optional()
        .describe('Source type name.'),
      alertType: z
        .enum(['error', 'warning', 'info', 'success', 'user_update', 'recommendation', 'snapshot'])
        .title('Alert Type')
        .optional()
        .describe('Type of event.'),
      deviceName: z.string().title('Device Name').optional().describe('Name of the device.'),
      host: z.string().title('Host').optional().describe('Host name to associate with the event.'),
      aggregationKey: z.string().title('Aggregation Key').optional().describe('An arbitrary string to use for aggregation.'),
    })
    .title('Event')
    .describe('A Datadog event.')

  export type inferredType = z.infer<typeof schema>
}

