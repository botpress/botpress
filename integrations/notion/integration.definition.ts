import { IntegrationDefinition } from '@botpress/sdk'
import { z } from 'zod'

const emptyObject = z.object({})
const anyObject = z.object({}).passthrough()

export default new IntegrationDefinition({
  name: 'notion',
  version: '0.0.1',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      /**
       * The auth token for the integration [Notion Integrations](https://developers.notion.com/docs/authorization#internal-integration-auth-flow-set-up)
       */
      authToken: z.string().min(1),
    }),
  },
  user: { tags: { id: {} } },
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
      input: { schema: z.object({ blockId: z.string().min(1) }) },
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
