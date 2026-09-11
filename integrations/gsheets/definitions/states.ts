import * as sdk from '@botpress/sdk'
const { z } = sdk

export const states = {
  oAuthConfig: {
    type: 'integration',
    schema: z.object({
      refreshToken: z
        .string()
        .title('Refresh token')
        .describe('The refresh token to use to authenticate with Google APIs. It gets exchanged for a bearer token'),
    }),
  },
  spreadsheetConfig: {
    type: 'integration',
    schema: z.object({
      spreadsheetIds: z
        .array(z.string().min(1))
        .min(1)
        .optional()
        .title('Spreadsheet IDs')
        .describe(
          'The IDs of the Google Spreadsheets selected during OAuth setup, in selection order. The first one is the default used by actions that do not specify a spreadsheet.'
        ),
      spreadsheetId: z
        .string()
        .optional()
        .title('Spreadsheet ID (legacy)')
        .describe(
          'Deprecated: the single spreadsheet ID written by versions of this integration that only supported one spreadsheet. Read as a fallback when "spreadsheetIds" is absent; never written by new setups.'
        ),
    }),
  },
} as const satisfies sdk.IntegrationDefinitionProps['states']
