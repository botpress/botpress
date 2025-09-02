import { IntegrationDefinitionProps, z } from '@botpress/sdk'
import { itemSchemaInput, itemSchemaOutput, paginationSchema } from './itemSchema'

export const collectionsItemsActionsDefinitions = {
  listItems: {
    title: 'List Collection Items',
    input: {
      schema: z.object({
        apiTokenOverwrite: z.string().optional().describe('Optional API Token to overwrite the default one'),
        collectionID: z.string().min(1, 'Collection ID is required').describe('The ID of your Webflow collection'),
        pagination: paginationSchema.optional().describe('Pagination parameters'),
        isLiveItems: z.boolean().default(false).describe('checkbox to decide if the list is for live items or not')
      }),
    },
    output: {
      schema: z.object({
        items: z.array(itemSchemaOutput).describe('Array of items'),
        pagination: z.object({
          limit: z.number().min(1).optional().describe('The limit specified in the request'),
          offset: z.number().min(0).optional().describe('The offset specified for the pagination'),
          total: z.number().min(0).optional().describe('Total number of items in the collection'),
        }),
      }),
    },
  },
  getItem: {
    title: 'Get Collection Item',
    input: {
      schema: z.object({
        apiTokenOverwrite: z.string().optional().describe('Optional API Token to overwrite the default one'),
        collectionID: z.string().min(1, 'Collection ID is required').describe('The ID of your Webflow collection'),
        isLiveItems: z.boolean().default(false).describe('checkbox to decide if the list is for live items or not'),
        itemID: z.string().min(1, 'Item ID is required').describe('The ID of your Webflow item'),
      }),
    },
    output: {
      schema: z.object({
        itemDetails: itemSchemaOutput.describe('Details of the item'),
      }),
    },
  },
  createItems: {
    title: 'Create Collection item(s)',
    input: {
      schema: z.object({
        apiTokenOverwrite: z.string().optional().describe('Optional API Token to overwrite the default one'),
        collectionID: z.string().min(1, 'Collection ID is required').describe('The ID of your Webflow collection'),
        isLiveItems: z.boolean().default(false).describe('checkbox to decide if the list is for live items or not'),
        items: z.array(
          z.object({
            isArchived: z.boolean().default(false),
            isDraft: z.boolean().default(false),
            fieldData: z.object({ name: z.string().min(1), slug: z.string().min(1) }),
          })
        )
      }),
    },
    output: {
      schema: z.object({
        items: z.array(
          z.object({
            id: z.string().optional(),
            cmsLocaleIds: z.array(z.string()).optional(),
            lastPublished: z.string().nullable(),
            lastUpdated: z.string().optional(),
            createdOn: z.string().optional(),
            // TODO find a more elegant solution
            // Supports only text items
            fieldData: z.record(z.string()).optional(),
            isArchived: z.boolean().optional(),
            isDrafted: z.boolean().optional()
          })
        )
      }),
    },
  },
  updateItems: {
    title: 'Update Item(s)',
    input: {
      schema: z.object({
        apiTokenOverwrite: z.string().optional().describe('Optional API Token to overwrite the default one'),
        collectionID: z.string().min(1, 'Collection ID is required').describe('The ID of your Webflow collection'),
        items: z.array(itemSchemaInput).describe('Array of items to update'),
        isLiveItems: z.boolean().default(false).describe('checkbox to decide if the list is for live items or not'),
      }),
    },
    output: {
      schema: z.object({
        items: z.array(itemSchemaOutput).describe('Array of updated collection items'),
      }),
    },
  },
  deleteItems: {
    title: 'Delete Item(s)',
    input: {
      schema: z.object({
        apiTokenOverwrite: z.string().optional().describe('Optional API Token to overwrite the default one'),
        collectionID: z.string().min(1, 'Collection ID is required').describe('The ID of your Webflow collection'),
        itemIDs: z.object({
          items: z.array(
            z.object({ id: z.string().min(1, 'Item ID is required').describe('Unique identifier for the Item') })
          ),
        }),
      }),
    },
    output: {
      schema: z.object({ success: z.boolean().describe('Indicates if the items were successfully deleted') }),
    },
  },
  publishItems: {
    title: 'Publish Item(s)',
    input: {
      schema: z.object({
        apiTokenOverwrite: z.string().optional().describe('Optional API Token to overwrite the default one'),
        collectionID: z.string().min(1, 'Collection ID is required').describe('The ID of your Webflow collection'),
        itemIds: z.array(
          z.string().min(1, 'Item ID is required').describe('Unique identifier for the Item')
        ),
      })
    },
    output: {
      schema: z.object({
        publishedItemIds: z.array(z.string()),
        errors: z.array(z.string())
      })
    }
  },
  unpublishLiveItems: {
    title: 'Unpublish Live Item(s)',
    input: {
      schema: z.object({
        apiTokenOverwrite: z.string().optional().describe('Optional API Token to overwrite the default one'),
        collectionID: z.string().min(1, 'Collection ID is required').describe('The ID of your Webflow collection'),
        itemIds: z.array(
          z.string().min(1, 'Item ID is required').describe('Unique identifier for the Item')
        ),
      })
    },
    output: {
      schema: z.object({ success: z.boolean().describe('Indicates if the items were successfully unpublished') }),
    }
  }

} satisfies IntegrationDefinitionProps['actions']
