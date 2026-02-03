import * as sdk from '@botpress/sdk'

export const actions = {
  createPage: {
    title: 'Create Page',
    description: 'Create a new page in Notion',
    input: {
      schema: sdk.z.object({
        parentType: sdk.z.enum(['data source', 'page']).title('Parent Type').describe('The type of the parent'),
        parentId: sdk.z
          .string()
          .min(1)
          .title('Parent ID')
          .describe('The ID of the parent to add the page to. Can be found in the URL of the parent'),
        title: sdk.z.string().title('Page Title').describe('The title of the page'),
        dataSourceTitleName: sdk.z
          .string()
          .title('Data Source Title Name')
          .describe('The name of the title property in the data source. If not provided, the default is "Name".')
          .optional()
          .default('Name'),
      }),
    },
    output: {
      schema: sdk.z.object({
        pageId: sdk.z.string().title('Page ID').describe('The ID of the page that was created'),
      }),
    },
  },
  updatePageProperties: {
    title: 'Update Page Properties',
    description: 'Update one or more properties on a Notion page using raw Notion properties JSON',
    input: {
      schema: sdk.z.object({
        pageId: sdk.z
          .string()
          .min(1)
          .title('Page ID')
          .describe('The ID of the page to update. Can be found in the page URL'),
        propertiesJson: sdk.z
          .string()
          .min(2)
          .title('Properties (JSON)')
          .describe(
            'Stringified JSON object for the Notion properties payload (same format as Notion pages.update API endpoint but without the "properties" key). Check the Notion API documentation for the correct format. https://developers.notion.com/reference/patch-page'
          )
          .placeholder('{"In stock": { "checkbox": true }}'),
      }),
    },
    output: {
      schema: sdk.z.object({
        pageId: sdk.z.string().title('Page ID').describe('The updated page ID'),
      }),
    },
  },
  addComment: {
    title: 'Add Comment',
    description: 'Add a comment to a page, block, or discussion in Notion',
    input: {
      schema: sdk.z.object({
        parentType: sdk.z.enum(['page', 'block', 'discussion']).title('Parent Type').describe('The type of the parent'),
        parentId: sdk.z
          .string()
          .min(1)
          .title('Parent ID')
          .describe('The ID of the parent to add the comment to. Can be found in the URL of the parent'),
        commentBody: sdk.z.string().min(1).title('Comment Body').describe('Must be plain text'),
      }),
    },
    output: {
      schema: sdk.z.object({
        commentId: sdk.z.string().title('Comment ID').describe('The ID of the comment that was created'),
        discussionId: sdk.z
          .string()
          .optional()
          .title('Discussion ID')
          .describe('The ID of the discussion that was created'),
      }),
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
      schema: sdk.z.object({
        blockId: sdk.z.string().title('Block ID').describe('The ID of the block that was deleted'),
      }),
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
        object: sdk.z.string().optional().title('Database Object').describe('The type of object returned'),
        dataSources: sdk.z
          .array(
            sdk.z.object({
              id: sdk.z.string().title('Data Source ID').describe('The ID of the data source'),
              name: sdk.z.string().title('Data Source Name').describe('The name of the data source'),
            })
          )
          .title('Data Sources')
          .describe('List of data sources in the database'),
      }),
    },
  },
  getDataSource: {
    title: 'Get Data Source',
    description: 'Get a data source from Notion',
    input: {
      schema: sdk.z.object({
        dataSourceId: sdk.z
          .string()
          .min(1)
          .title('Data Source ID')
          .describe('The ID of the data source to fetch. Can be found in the URL of the data source'),
      }),
    },
    output: {
      schema: sdk.z.object({
        object: sdk.z.string().title('Data Source Object').describe('A stringified representation of the data source'),
        properties: sdk.z
          .record(sdk.z.string(), sdk.z.object({}).passthrough())
          .title('Data Source Properties')
          .describe('Schema of properties for the data source as they appear in Notion'),
        pages: sdk.z
          .array(
            sdk.z.object({
              id: sdk.z.string().title('Page ID').describe('The ID of the page'),
              title: sdk.z.string().title('Page Title').describe('The title of the page'),
              pageProperties: sdk.z
                .record(sdk.z.string(), sdk.z.object({}).passthrough())
                .title('Page Properties')
                .describe('Schema of properties for the page as they appear in Notion'),
            })
          )
          .title('Pages')
          .describe('List of pages in the data source'),
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
  appendBlocksToPage: {
    title: 'Append Blocks to Page',
    description: 'Append a markdown text to a page in Notion. The markdown text will be converted to notion blocks.',
    input: {
      schema: sdk.z.object({
        pageId: sdk.z
          .string()
          .min(1)
          .title('Page ID')
          .describe('The ID of the page to append the blocks to. Can be found in the URL of the page'),
        markdownText: sdk.z.string().title('Markdown Text').describe('The markdown text to append to the page'),
      }),
    },
    output: {
      schema: sdk.z.object({
        pageId: sdk.z.string().title('Page ID').describe('The ID of the page where blocks were appended'),
        blockIds: sdk.z.array(sdk.z.string()).title('Block IDs').describe('The IDs of the blocks that were created'),
      }),
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
