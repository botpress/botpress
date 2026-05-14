import * as sdk from '@botpress/sdk'
const { z } = sdk

export const configuration = {
    schema: z.object({
      grafanaUsername: z
        .string()
        .min(1, 'The username for Grafana is required')
        .title('Grafana username')
        .describe('The username for your Grafana instance (e.g., USERNAME)'),
      grafanaServiceAccountToken: z
        .string()
        .min(1, 'Service account token is required')
        .title('Service account token')
        .describe('The Service account token for your Grafana instance'),
    }).strict(),
  }
