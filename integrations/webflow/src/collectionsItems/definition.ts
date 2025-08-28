import { IntegrationDefinitionProps, z } from '@botpress/sdk'
import { itemSchemaInput, itemSchemaOutput } from './item'

export const collectionsItemsActionsDefinitions = {
  listItems: {
    title: 'List Collection Items',
    input: {
      schema: z.object({
        apiTokenOverwrite: z.string().optional().describe('Optional API Token to overwrite the default one'),
        collectionID: z.string().min(1, 'Collection ID is required').describe('The ID of your Webflow collection'),
        pagination: z
          .object({
            limit: z.number().default(100).optional().describe('The number of items to return'),
            offset: z.number().default(0).optional().describe('The number of items to skip'),
          })
          .optional()
          .describe('Pagination parameters'),
      }),
    },
    output: {
      schema: z.object({
        // add Item array schema
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
        itemID: z.string().min(1, 'Item ID is required').describe('The ID of your Webflow item'),
      }),
    },
    output: {
      schema: z.object({
        // add item schema
        itemDetails: itemSchemaOutput.describe('Details of the item'),
      }),
    },
  },
  createItem: {
    // TODO: test single and multiple item creation
    title: 'Create Collection item(s)',
    input: {
      schema: z.object({
        apiTokenOverwrite: z.string().optional().describe('Optional API Token to overwrite the default one'),
        collectionID: z.string().min(1, 'Collection ID is required').describe('The ID of your Webflow collection'),
        items: z.array(itemSchemaInput).describe('Array of items to create'),
      }),
    },
    output: {
      schema: z.object({
        item: itemSchemaOutput.describe('Details of the new collection item'),
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
        itemIDs: z.array(z.string().min(1, 'Item ID is required')).describe('Array of item IDs to delete'),
      }),
    },
    output: {
      schema: z.object({ success: z.boolean().describe('Indicates if the items were successfully deleted') }),
    },
  },
} satisfies IntegrationDefinitionProps['actions']
