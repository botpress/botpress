import * as sdk from '@botpress/sdk'
const { z } = sdk

export const events = {
  alertFired: {
    title: 'Alert Fired',
    description: 'Emitted when Grafana sends an alert webhook',
    schema: z.object({
      alertName: z.string().title('Alert Name').describe('Name of the alert rule that fired'),
      status: z.string().title('Status').describe('Current status of the alert (e.g. firing, resolved)'),
      ruleUid: z.string().title('Rule UID').describe('UID of the Grafana alert rule'),
      botpressId: z
        .string()
        .optional()
        .title('Botpress ID')
        .describe('Optional correlation ID round-tripped through Grafana labels'),
      labels: z.record(z.string()).optional().title('Labels').describe('Key-value label set attached to the alert'),
      startsAt: z.string().optional().title('Starts At').describe('ISO 8601 timestamp when the alert started firing'),
    }),
  },
}
