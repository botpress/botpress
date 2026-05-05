import * as sdk from '@botpress/sdk'

const makeApiRequest = {
  title: 'Make API Request',
  description: 'Make a request to Salesforce API',
  input: {
    schema: sdk.z.object({
      method: sdk.z.string().title('Method').describe('HTTP method (GET, POST, PATCH, DELETE)'),
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
      success: sdk.z.boolean().title('Success').describe('Whether the request was successful'),
      status: sdk.z.number().optional().title('Status').describe('HTTP status code of the response'),
      body: sdk.z.any().optional().title('Body').describe('Response body from the API'),
      error: sdk.z.string().optional().title('Error').describe('Error message if the request failed'),
    }),
  },
} satisfies sdk.ActionDefinition

export const apiActionDefinitions = {
  makeApiRequest,
} satisfies sdk.IntegrationDefinitionProps['actions']
