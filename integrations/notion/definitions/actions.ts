import * as sdk from '@botpress/sdk'

export const actions = {
  addPageToDb: {
    title: 'Create Page in Database',
    description: 'Add a new page to a database in Notion',
    input: {
      schema: sdk.z.object({
        databaseId: sdk.z
          .string()
          .min(1)
          .title('Database ID')
          .describe('The ID of the database to add the page to. Can be found in the URL of the database'),
        pageProperties: sdk.z
          .record(sdk.z.string(), sdk.z.object({}).passthrough())
          .title('Page Properties')
          .describe("The values of the page's properties. Must match the parent database's properties"),
      }),
    },
    output: {
      schema: sdk.z.object({}),
    },
  },
  addCommentToPage: {
    title: 'Add Comment to Page',
    description: 'Add a comment to a page in Notion',
    input: {
      schema: sdk.z.object({
        pageId: sdk.z
          .string()
          .min(1)
          .title('Page ID')
          .describe('The ID of the page to add the comment to. Can be found in the URL of the page'),
        commentBody: sdk.z.string().min(1).title('Comment Body').describe('Must be plain text'),
      }),
    },
    output: {
      schema: sdk.z.object({}),
    },
  },
  deleteBlock: {
    title: 'Delete Block',
    description: 'Delete a block in Notion',
    input: {
      schema: sdk.z.object({
        blockId: sdk.z
          .string()
          .min(1)
          .title('Block ID')
          .describe('The ID of the block to delete. Can be found in the URL of the block'),
      }),
    },
    output: {
      schema: sdk.z.object({}),
    },
  },
  getDb: {
    title: 'Get Database',
    description: 'Get a database from Notion',
    input: {
      schema: sdk.z.object({
        databaseId: sdk.z
          .string()
          .min(1)
          .title('Database ID')
          .describe('The ID of the database to fetch. Can be found in the URL of the database'),
      }),
    },
    output: {
      schema: sdk.z.object({
        object: sdk.z.string().title('Database Object').describe('A stringified representation of the database'),
        properties: sdk.z
          .record(sdk.z.string(), sdk.z.object({}).passthrough())
          .title('Database Properties')
          .describe('Schema of properties for the database as they appear in Notion'),
        structure: sdk.z
          .string()
          .title('Database Structure')
          .describe('A stringified representation of the database structure'),
      }),
    },
  },
  getPage: {
    title: 'Get Page',
    description: 'Get a page from Notion',
    input: {
      schema: sdk.z.object({
        pageId: sdk.z
          .string()
          .min(1)
          .title('Page ID')
          .describe('The ID of the page to fetch. Can be found in the URL of the page'),
      }),
    },
    output: {
      schema: sdk.z.object({
        object: sdk.z.string().optional().title('Result Object').describe('The type of object returned'),
        id: sdk.z.string().optional().title('Result ID').describe('The ID of the object returned'),
        created_time: sdk.z.string().optional().title('Created Time').describe('The time the object was created'),
        parent: sdk.z.object({}).passthrough().optional().title('Parent').describe('The parent of the object'),
        created_by: sdk.z
          .object({
            object: sdk.z.string().optional().title('Created By Object').describe('The type of object returned'),
            id: sdk.z.string().optional().title('Created By ID').describe('The ID of the object returned'),
          })
          .optional()
          .title('Created By')
          .describe('The user who created the object'),
        archived: sdk.z.boolean().optional().title('Archived').describe('Whether the object is archived'),
        properties: sdk.z
          .record(sdk.z.string(), sdk.z.object({}).passthrough())
          .optional()
          .title('Page Properties')
          .describe('Schema of properties for the page as they appear in Notion'),
      }),
    },
  },
  addCommentToDiscussion: {
    title: 'Add Comment to Discussion',
    description: 'Add a comment to a discussion in Notion',
    input: {
      schema: sdk.z.object({
        discussionId: sdk.z
          .string()
          .min(1)
          .title('Discussion ID')
          .describe('The ID of the discussion to add the comment to. Can be found in the URL of the discussion'),
        commentBody: sdk.z.string().min(1).title('Comment Body').describe('Must be plain text'),
      }),
    },
    output: {
      schema: sdk.z.object({}),
    },
  },
  searchByTitle: {
    title: 'Search by Title',
    description:
      'Search for pages and databases in Notion. Optionally filter by title. Only returns items that have been shared with the integration.',
    input: {
      schema: sdk.z.object({
        title: sdk.z
          .string()
          .optional()
          .title('Title')
          .describe(
            'Optional search query to match against page and database titles. If not provided, returns all accessible pages and databases.'
          ),
      }),
    },
    output: {
      schema: sdk.z.object({
        results: sdk.z
          .array(
            sdk.z.object({
              id: sdk.z.string().title('ID').describe('The ID of the page or database'),
              title: sdk.z.string().title('Title').describe('The title of the page or database'),
              type: sdk.z.string().title('Type').describe('The type of the result (page or database)'),
              url: sdk.z.string().title('URL').describe('The URL to the page or database'),
            })
          )
          .title('Results')
          .describe('Array of pages and databases matching the search query'),
      }),
    },
  },
  getPageContent: {
    title: 'Get Page Content',
    description: 'Get the content blocks of a page or block in Notion',
    input: {
      schema: sdk.z.object({
        pageId: sdk.z
          .string()
          .min(1)
          .title('Page or Block ID')
          .describe('The ID of the page or block to fetch content from. Can be found in the URL'),
      }),
    },
    output: {
      schema: sdk.z.object({
        blocks: sdk.z
          .array(
            sdk.z.object({
              blockId: sdk.z.string().title('Block ID').describe('The unique ID of the block'),
              parentId: sdk.z.string().optional().title('Parent ID').describe('The ID of the parent page or block'),
              type: sdk.z.string().title('Type').describe('The type of the block (paragraph, heading_1, etc.)'),
              hasChildren: sdk.z.boolean().title('Has Children').describe('Whether the block has nested child blocks'),
              richText: sdk.z
                .array(sdk.z.object({}).passthrough())
                .title('Rich Text')
                .describe('The rich text content of the block with formatting information'),
            })
          )
          .title('Blocks')
          .describe('Array of content blocks from the page'),
      }),
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['actions']
