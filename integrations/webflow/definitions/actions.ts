import { IntegrationDefinitionProps, z } from '@botpress/sdk'

const fieldTypeSchema = z.enum([
  'Color',
  'DateTime',
  'Email',
  'ExtFileRef',
  'File',
  'Image',
  'Link',
  'Multimage',
  'MultiReference',
  'Number',
  'Option',
  'Phone',
  'PlainText',
  'Reference',
  'RichText',
  'Switch',
  'VideoLink',
])

const collectionSchema = z.object({
  id: z.string().optional(),
  displayName: z.string(),
  singularName: z.string(),
  slug: z.string().optional(),
  createdOn: z.string().optional(),
  lastUpdated: z.string().optional(),
})

const collectionDetailsSchema = collectionSchema.extend({
  fields: z.array(
    z.object({
      id: z.string(),
      isRequired: z.boolean(),
      type: fieldTypeSchema,
      displayName: z.string(),
      isEditable: z.boolean().nullable(),
      slug: z.string().nullable(),
      helpText: z.string().nullable(),
      validation: z.any(),
    })
  ),
})

const itemSchemaInput = z.object({
  id: z.string().optional().describe('Unique identifier for the Item'),
  fieldData: z
    .object({
      name: z.string().min(1, 'Field name is required').describe('Name of the Item'),
      slug: z
        .string()
        .describe(
          'URL structure of the Item in your site. Note: Updates to an item slug will break all links referencing the old slug.'
        ),
    })
    .describe('The field data of your Webflow item'),
  cmsLocaleId: z.string().optional().describe('Identifier for the locale of the CMS item'),
  isArchived: z.boolean().optional().describe('Boolean determining if the Item is set to archived'),
  isDraft: z.boolean().optional().describe('Boolean determining if the Item is set to draft'),
})

const itemSchemaOutput = itemSchemaInput.extend({
  lastPublished: z.string().nullable().describe('The date the item was last published'),
  lastUpdated: z.string().optional().describe('The date the item was last updated'),
  createdOn: z.string().optional().describe('The date the item was created'),
})

const paginationSchema = z.object({
  limit: z.number().default(100).optional().describe('The number of items to return'),
  offset: z.number().default(0).optional().describe('The number of items to skip'),
})

export const actions = {
  listCollections: {
    title: 'List Collections',
    input: {
      schema: z.object({}),
    },
    output: {
      schema: z.object({
        collections: z.array(collectionSchema).describe('Array of collections'),
      }),
    },
  },
  getCollectionDetails: {
    title: 'Get Collection Details',
    input: {
      schema: z.object({
        collectionID: z.string().min(1, 'Collection ID is required').describe('The ID of your Webflow collection'),
      }),
    },
    output: {
      schema: z.object({
        collectionDetails: collectionDetailsSchema.describe('Details of the collection'),
      }),
    },
  },
  createCollection: {
    title: 'Create Collection',
    input: {
      schema: z.object({
        collectionInfo: collectionSchema.describe('Informations of the collection to create.'),
      }),
    },
    output: {
      schema: z.object({
        collectionDetails: collectionDetailsSchema.describe('Details of the new collection'),
      }),
    },
  },
  deleteCollection: {
    title: 'Delete Collection',
    input: {
      schema: z.object({
        collectionID: z.string().min(1, 'Collection ID is required').describe('The ID of your Webflow collection'),
      }),
    },
    output: {
      schema: z.object({}),
    },
  },
  listItems: {
    title: 'List Collection Items',
    input: {
      schema: z.object({
        collectionID: z.string().min(1, 'Collection ID is required').describe('The ID of your Webflow collection'),
        pagination: paginationSchema.optional().describe('Pagination parameters'),
        isLiveItems: z.boolean().default(false).describe('checkbox to decide if the list is for live items or not'),
      }),
    },
    output: {
      schema: z.object({
        items: z.array(itemSchemaOutput).describe('Array of items'),
        pagination: paginationSchema.extend({
          total: z.number().min(0).optional().describe('Total number of items in the collection'),
        }),
      }),
    },
  },
  getItem: {
    title: 'Get Collection Item',
    input: {
      schema: z.object({
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
        collectionID: z.string().min(1, 'Collection ID is required').describe('The ID of your Webflow collection'),
        isLiveItems: z.boolean().default(false).describe('checkbox to decide if the list is for live items or not'),
        items: z.array(
          z.object({
            isArchived: z.boolean().default(false),
            isDraft: z.boolean().default(false),
            fieldData: z.object({ name: z.string().min(1), slug: z.string().min(1) }),
          })
        ),
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
            isDrafted: z.boolean().optional(),
          })
        ),
      }),
    },
  },
  updateItems: {
    title: 'Update Item(s)',
    input: {
      schema: z.object({
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
        collectionID: z.string().min(1, 'Collection ID is required').describe('The ID of your Webflow collection'),
        itemIDs: z.object({
          items: z.array(
            z.object({ id: z.string().min(1, 'Item ID is required').describe('Unique identifier for the Item') })
          ),
        }),
      }),
    },
    output: {
      schema: z.object({}),
    },
  },
  publishItems: {
    title: 'Publish Item(s)',
    input: {
      schema: z.object({
        collectionID: z.string().min(1, 'Collection ID is required').describe('The ID of your Webflow collection'),
        itemIds: z.array(z.string().min(1, 'Item ID is required').describe('Unique identifier for the Item')),
      }),
    },
    output: {
      schema: z.object({
        publishedItemIds: z.array(z.string()),
        errors: z.array(z.string()),
      }),
    },
  },
  unpublishLiveItems: {
    title: 'Unpublish Live Item(s)',
    input: {
      schema: z.object({
        collectionID: z.string().min(1, 'Collection ID is required').describe('The ID of your Webflow collection'),
        itemIds: z.array(z.string().min(1, 'Item ID is required').describe('Unique identifier for the Item')),
      }),
    },
    output: {
      schema: z.object({}),
    },
  },
} satisfies IntegrationDefinitionProps['actions']
