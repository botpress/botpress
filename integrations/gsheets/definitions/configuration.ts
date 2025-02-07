import * as sdk from '@botpress/sdk'
const { z } = sdk

const _commonConfig = {
  spreadsheetId: z
    .string()
    .title('Spreadsheet ID')
    .min(1)
    .describe(
      'The ID of the Google Spreadsheet to interact with. This is the last part of the URL of your spreadsheet (ex: https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit)'
    ),
} as const

export const configuration = {
  schema: z.object({
    ..._commonConfig,
  }),
  identifier: { linkTemplateScript: 'linkTemplate.vrl', required: true },
} as const satisfies sdk.IntegrationDefinitionProps['configuration']

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

export const identifier = {} as const satisfies sdk.IntegrationDefinitionProps['identifier']
