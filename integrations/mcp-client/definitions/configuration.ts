import * as sdk from '@botpress/sdk'
const { z } = sdk

export const configuration = {
  schema: z.object({
    serverUrl: z
      .string()
      .url()
      .title('MCP Server URL')
      .describe('URL of the MCP server SSE endpoint (e.g. http://localhost:3000/sse)'),
    apiKey: z
      .string()
      .secret()
      .optional()
      .title('API Key')
      .describe('Optional API key for authentication with the MCP server'),
    timeout: z.number().default(30000).title('Timeout (ms)').describe('Request timeout in milliseconds'),
  }),
} as const satisfies sdk.IntegrationDefinitionProps['configuration']
