import * as sdk from '@botpress/sdk'
const { z } = sdk

export const configuration = {
  schema: z.object({
    spreadsheetId: z
      .string()
      .title('Spreadsheet ID')
      .min(1)
      .describe(
        'The ID of the Google Spreadsheet to interact with. This is the last part of the URL of your spreadsheet (ex: https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit#gid=0)'
      ),
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
} satisfies sdk.IntegrationDefinitionProps['configuration']

export const configurations = {} as const satisfies sdk.IntegrationDefinitionProps['configurations']

export const identifier = {} as const satisfies sdk.IntegrationDefinitionProps['identifier']
