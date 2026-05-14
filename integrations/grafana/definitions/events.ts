import * as sdk from '@botpress/sdk'
const { z } = sdk


export const events = {
    alertFired: {
      title: 'Alert Fired',
      description: 'Emitted when Grafana sends an alert webhook',
      schema: z.object({
        alertName: z.string(),
        status: z.string(),
        ruleUid: z.string(),
        botpressId: z.string().optional(),
        labels: z.record(z.string()).optional(),
        startsAt: z.string().optional(),
      }),
    },
  }
