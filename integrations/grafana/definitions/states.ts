import * as sdk from '@botpress/sdk'
const { z } = sdk

export const states = {
  webhookConfig: {
    type: 'integration' as const,
    schema: z.object({
      webhookUrl: z.string().title('Webhook URL').describe('Public URL Grafana posts alert webhooks to'),
      k8sNamespace: z.string().title('K8s Namespace').describe('Kubernetes namespace used for webhook routing'),
      webhookSecret: z
        .string()
        .title('Webhook Secret')
        .describe('HMAC secret used to validate incoming webhook payloads'),
    }),
  },
}
