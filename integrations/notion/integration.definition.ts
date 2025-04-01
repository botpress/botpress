/* bplint-disable */
import { z, IntegrationDefinition } from '@botpress/sdk'

const emptyObject = z.object({})
const anyObject = z.object({}).passthrough()

export default new IntegrationDefinition({
  name: 'notion',
  description: 'Add pages and comments, manage databases, and engage in discussions — all within your chatbot.',
  title: 'Notion',
  version: '1.0.0',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({}),
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
      required: true,
    },
  },
  configurations: {
    customApp: {
      title: 'Manual configuration with a custom Notion integration',
      description: 'Configure the integration using a Notion integration token.',
      schema: z.object({
        authToken: z
          .string()
          .min(1)
          .title('Notion Integration Token')
          .describe('Can be found on Notion in your integration settings.'),
      }),
    },
  },
  user: { tags: { id: {} } },
  secrets: {
    CLIENT_ID: {
      description: 'The client ID of the Botpress Notion Integration.',
    },
    CLIENT_SECRET: {
      description: 'The client secret of the Botpress Notion Integration.',
    },
    WEBHOOK_VERIFICATION_SECRET: {
      description: 'The Notion-provided secret for verifying incoming webhooks.',
    },
  },
  states: {
    oauth: {
      type: 'integration',
      schema: z.object({
        authToken: z.string(),
      }),
    },
  },
  actions: {
    addPageToDb: {
      input: {
        schema: z.object({
          databaseId: z.string().min(1),
          pageProperties: z.record(z.string(), anyObject),
        }),
      },
      output: {
        schema: emptyObject,
      },
    },
    addCommentToPage: {
      input: {
        schema: z.object({
          pageId: z.string().min(1),
          commentBody: z.string().min(1),
        }),
      },
      output: {
        schema: emptyObject,
      },
    },
    deleteBlock: {
      input: { schema: z.object({ blockId: z.string().min(1) }), ui: { blockId: {} } },
      output: {
        schema: emptyObject,
      },
    },
    getDb: {
      input: { schema: z.object({ databaseId: z.string().min(1) }) },
      output: {
        schema: z.object({
          object: z.string(),
          properties: z.record(z.string(), anyObject),
          /**
           * Refer to [getDbStructure](./src/notion/notion.ts) for more details
           */
          structure: z.string(),
        }),
      },
    },
    addCommentToDiscussion: {
      input: {
        schema: z.object({
          discussionId: z.string().min(1),
          commentBody: z.string().min(1),
        }),
      },
      output: {
        schema: emptyObject,
      },
    },
  },
})
