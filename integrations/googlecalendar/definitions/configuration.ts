import { default as sdk, z } from '@botpress/sdk'

const _commonConfig = {
  calendarId: z
    .string()
    .title('Calendar ID')
    .min(1)
    .describe('The ID of the Google Calendar to interact with. You can find it in your Google Calendar settings.'),
} as const

export const configuration = {
  schema: z.object({
    ..._commonConfig,
  }),
  identifier: { linkTemplateScript: 'linkTemplate.vrl', required: true },
} as const satisfies sdk.IntegrationDefinitionProps['configuration']

export const identifier = undefined satisfies sdk.IntegrationDefinitionProps['identifier']

export const configurations = {
  serviceAccountKey: {
    title: 'Manual configuration',
    description: 'Configure manually with a Service Account Key',
    schema: z.object({
      ..._commonConfig,
      privateKey: z
        .string()
        .title('Service account private key')
        .min(1)
        .describe('The private key from the Google service account. You can get it from the downloaded JSON file.'),
      clientEmail: z
        .string()
        .title('Service account email')
        .email()
        .describe('The client email from the Google service account. You can get it from the downloaded JSON file.'),
    }),
  },
} as const satisfies sdk.IntegrationDefinitionProps['configurations']
