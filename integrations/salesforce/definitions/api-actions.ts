import * as sdk from '@botpress/sdk'

const makeApiRequest = {
  title: 'Make API Request',
  description: 'Make a request to Salesforce API',
  input: {
    schema: sdk.z.object({
      method: sdk.z.string(),
      path: sdk.z.string().title('Path').describe('yourinstance.salesforce.com/services/data/v54.0/PATH'),
      headers: sdk.z.string().optional().title('Headers').describe('Headers in JSON format'),
      params: sdk.z.string().optional().title('Params').describe('Params in JSON format'),
      requestBody: sdk.z
        .string()
        .displayAs<any>({
          id: 'text',
          params: {
            allowDynamicVariable: true,
            growVertically: true,
            multiLine: true,
            resizable: true,
          },
        })
        .optional()
        .title('Request Body')
        .describe('Request body in JSON format'),
    }),
  },
  output: {
    schema: sdk.z.object({
      success: sdk.z.boolean(),
      status: sdk.z.number().optional(),
      body: sdk.z.any().optional(),
      error: sdk.z.string().optional(),
    }),
  },
} satisfies sdk.ActionDefinition

export const apiActionDefinitions = {
  makeApiRequest,
} satisfies sdk.IntegrationDefinitionProps['actions']
