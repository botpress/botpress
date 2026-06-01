import { z, IntegrationDefinition } from '@botpress/sdk'

export default new IntegrationDefinition({
  name: 'n8n',
  title: 'n8n',
  description: 'This integration allows you to interact with n8n workflows.',
  version: '0.1.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      baseUrl: z
        .string()
        .url()
        .title('Base URL')
        .describe('The base URL of your n8n instance, for example https://example.app.n8n.cloud'),
      accessKey: z
        .string()
        .min(1)
        .title('Access Key')
        .describe('Your n8n API key. Found in n8n under Settings → n8n API.'),
    }),
  },
  actions: {
    listWorkflows: {
      title: 'List Workflows',
      description: 'Retrieves workflows from n8n.',
      input: {
        schema: z.object({
          active: z.boolean().optional().title('Active').describe('Filter by workflow active state'),
          name: z.string().optional().title('Name').describe('Filter by workflow name'),
          tags: z.string().optional().title('Tags').describe('Comma-separated tag filter'),
          projectId: z.string().optional().title('Project ID').describe('Filter by project ID'),
          excludePinnedData: z
            .boolean()
            .optional()
            .default(true)
            .title('Exclude Pinned Data')
            .describe('Exclude pinned data from the response'),
          limit: z
            .number()
            .int()
            .max(250)
            .optional()
            .title('Limit')
            .describe('Maximum number of workflows to return (1-250)'),
          cursor: z.string().optional().title('Cursor').describe('Pagination cursor from a previous request'),
        }),
      },
      output: {
        schema: z.object({
          data: z.array(z.any()).title('Workflows').describe('List of workflows returned by n8n'),
          nextCursor: z
            .string()
            .optional()
            .title('Next Cursor')
            .describe('Cursor for fetching the next page of results'),
        }),
      },
    },
    getWorkflow: {
      title: 'Get Workflow',
      description: 'Retrieves a single workflow from n8n by ID.',
      input: {
        schema: z.object({
          workflowId: z.string().min(1).title('Workflow ID').describe('The workflow ID'),
          excludePinnedData: z
            .boolean()
            .optional()
            .default(true)
            .title('Exclude Pinned Data')
            .describe('Exclude pinned data from the response'),
        }),
      },
      output: {
        schema: z.object({
          workflow: z.any().title('Workflow').describe('The full workflow object returned by n8n'),
        }),
      },
    },
    triggerWorkflow: {
      title: 'Trigger Workflow',
      description: 'Resolves an n8n workflow webhook and posts data to it.',
      input: {
        schema: z.object({
          workflowIdOrName: z.string().min(1).title('Workflow ID or Name').describe('The workflow ID or name'),
          conversationId: z
            .string()
            .min(1)
            .placeholder('{{ event.conversationId }}')
            .title('Conversation ID')
            .describe('The current Botpress conversation ID — use {{event.conversationId}}'),
          payload: z
            .record(z.string(), z.any())
            .optional()
            .default({})
            .title('Payload')
            .describe('The JSON payload to send to the workflow'),
        }),
      },
      output: {
        schema: z.object({
          workflowId: z.string().optional().title('Workflow ID').describe('The ID of the triggered workflow'),
          workflowName: z.string().optional().title('Workflow Name').describe('The name of the triggered workflow'),
          response: z.any().optional().title('Response').describe('The response body returned by the n8n webhook'),
        }),
      },
    },
  },
  events: {
    n8nEvent: {
      title: 'n8n event',
      description: 'Triggered when n8n posts data back to Botpress.',
      schema: z.object({
        workflowId: z
          .string()
          .optional()
          .title('Workflow ID')
          .describe('The ID of the workflow that posted this event'),
        workflowName: z
          .string()
          .optional()
          .title('Workflow Name')
          .describe('The name of the workflow that posted this event'),
        data: z.record(z.string(), z.any()).title('Data').describe('Arbitrary data payload sent by the n8n workflow'),
      }),
    },
  },
  attributes: {
    category: 'Developer Tools',
    repo: 'botpress',
  },
})
