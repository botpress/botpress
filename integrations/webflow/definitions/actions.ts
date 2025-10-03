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
  id: z.string().optional().describe('Unique identifier for a Collection').title('Collection ID'),
  displayName: z.string().describe('Name given to the Collection').title('Collection Name'),
  singularName: z
    .string()
    .describe('The name of one Item in Collection (e.g. "Blog Post" if the Collection is called "Blog Posts")')
    .title('Collection Singular Name'),
  slug: z.string().optional().describe('Slug of Collection in Site URL structure').title('Collection Slug'),
  createdOn: z.string().optional().describe('The date the collection was created').title('Collection Created On'),
  lastUpdated: z
    .string()
    .optional()
    .describe('The date the collection was last updated')
    .title('Collection Last Updated'),
})

const collectionDetailsSchema = collectionSchema.extend({
  fields: z.array(
    z.object({
      id: z.string().describe('Unique identifier for a Field').title('Field ID'),
      isRequired: z.boolean().describe('define whether a field is required in a collection').title('Is Required'),
      type: fieldTypeSchema
        .describe('Choose these appropriate field type for your collection data')
        .title('Field Type'),
      displayName: z.string().describe('The name of the Field').title('Field Name'),
      isEditable: z.boolean().nullable().describe('Define whether the field is editable').title('Is Editable'),
      slug: z
        .string()
        .nullable()
        .describe(
          'Slug of Field in Site URL structure. Slugs should be all lowercase with no spaces. Any spaces will be converted to "-".'
        )
        .title('Field Slug'),
      helpText: z
        .string()
        .nullable()
        .describe('Additional text to help anyone filling out this field')
        .title('Field Help Text'),
      validation: z.any().describe('The validation for the field').title('Field Validation'),
    })
  ),
})

const itemSchemaInput = z.object({
  id: z.string().optional().describe('Unique identifier for the Item').title('Item ID'),
  fieldData: z
    .object({
      name: z.string().min(1, 'Field name is required').describe('Name of the Item').title('Item Name'),
      slug: z
        .string()
        .describe(
          'URL structure of the Item in your site. Note: Updates to an item slug will break all links referencing the old slug.'
        )
        .title('Item Slug'),
    })
    .describe('The field data of your Webflow item')
    .title('Field Data'),
  cmsLocaleId: z.string().optional().describe('Identifier for the locale of the CMS item').title('CMS Locale ID'),
  isArchived: z
    .boolean()
    .optional()
    .describe('Boolean determining if the Item is set to archived')
    .title('Is Archived'),
  isDraft: z.boolean().optional().describe('Boolean determining if the Item is set to draft').title('Is Draft'),
})

const itemSchemaOutput = itemSchemaInput.extend({
  lastPublished: z.string().nullable().describe('The date the item was last published').title('Last Published'),
  lastUpdated: z.string().optional().describe('The date the item was last updated').title('Last Updated'),
  createdOn: z.string().optional().describe('The date the item was created').title('Created On'),
})

const paginationSchema = z.object({
  limit: z.number().default(100).optional().describe('The number of items to return').title('Limit'),
  offset: z.number().default(0).optional().describe('The number of items to skip').title('Offset'),
})

export const actions = {
  listCollections: {
    title: 'List Collections',
    description: 'Retrieve a list of all collections in your Webflow site.',
    input: {
      schema: z.object({}),
    },
    output: {
      schema: z.object({
        collections: z.array(collectionSchema).describe('Array of collections').title('Collections'),
      }),
    },
  },
  getCollectionDetails: {
    title: 'Get Collection Details',
    description: 'Retrieve detailed information about a specific collection in your Webflow site.',
    input: {
      schema: z.object({
        collectionID: z
          .string()
          .min(1, 'Collection ID is required')
          .describe('The ID of your Webflow collection')
          .title('Collection ID'),
      }),
    },
    output: {
      schema: z.object({
        collectionDetails: collectionDetailsSchema.describe('Details of the collection').title('Collection Details'),
      }),
    },
  },
  createCollection: {
    title: 'Create Collection',
    description: 'Create a new collection in your Webflow site.',
    input: {
      schema: z.object({
        collectionInfo: collectionSchema.describe('Informations of the collection to create.').title('Collection Info'),
      }),
    },
    output: {
      schema: z.object({
        collectionDetails: collectionDetailsSchema
          .describe('Details of the new collection')
          .title('Collection Details'),
      }),
    },
  },
  deleteCollection: {
    title: 'Delete Collection',
    description: 'Delete a specific collection from your Webflow site.',
    input: {
      schema: z.object({
        collectionID: z
          .string()
          .min(1, 'Collection ID is required')
          .describe('The ID of your Webflow collection')
          .title('Collection ID'),
      }),
    },
    output: {
      schema: z.object({}),
    },
  },
  listItems: {
    title: 'List Collection Items',
    description:
      'List items in a Webflow collection. By default, this lists draft items. To list live items, set the "Is Live Items" parameter to true.',
    input: {
      schema: z.object({
        collectionID: z
          .string()
          .min(1, 'Collection ID is required')
          .describe('The ID of your Webflow collection')
          .title('Collection ID'),
        pagination: paginationSchema.optional().describe('Pagination parameters').title('Pagination'),
        isLiveItems: z
          .boolean()
          .default(false)
          .describe('checkbox to decide if the list is for live items or not')
          .title('Is Live Items'),
      }),
    },
    output: {
      schema: z.object({
        items: z.array(itemSchemaOutput).describe('Array of items').title('Items'),
        pagination: paginationSchema
          .extend({
            total: z.number().min(0).optional().describe('Total number of items in the collection').title('Total'),
          })
          .describe('Pagination details')
          .title('Pagination'),
      }),
    },
  },
  getItem: {
    title: 'Get Collection Item',
    description: 'Retrieve a specific item from a Webflow collection using its unique ID.',
    input: {
      schema: z.object({
        collectionID: z
          .string()
          .min(1, 'Collection ID is required')
          .describe('The ID of your Webflow collection')
          .title('Collection ID'),
        isLiveItems: z
          .boolean()
          .default(false)
          .describe('checkbox to decide if the list is for live items or not')
          .title('Is Live Items'),
        itemID: z.string().min(1, 'Item ID is required').describe('The ID of your Webflow item').title('Item ID'),
      }),
    },
    output: {
      schema: z.object({
        itemDetails: itemSchemaOutput.describe('Details of the item').title('Item Details'),
      }),
    },
  },
  createItems: {
    title: 'Create Collection item(s)',
    description: 'Create one or multiple items in a Webflow collection',
    input: {
      schema: z.object({
        collectionID: z
          .string()
          .min(1, 'Collection ID is required')
          .describe('The ID of your Webflow collection')
          .title('Collection ID'),
        isLiveItems: z
          .boolean()
          .default(false)
          .describe('checkbox to decide if the list is for live items or not')
          .title('Is Live Items'),
        items: z.array(itemSchemaInput).describe('Items to add to the collection').title('Items'),
      }),
    },
    output: {
      schema: z.object({
        items: z.array(itemSchemaOutput).describe('Details of the items created').title('Items'),
      }),
    },
  },
  updateItems: {
    title: 'Update Item(s)',
    description: 'Update one or more items in a collection',
    input: {
      schema: z.object({
        collectionID: z
          .string()
          .min(1, 'Collection ID is required')
          .describe('The ID of your Webflow collection')
          .title('Collection ID'),
        items: z.array(itemSchemaInput).describe('Array of items to update').title('Items'),
        isLiveItems: z
          .boolean()
          .default(false)
          .describe('checkbox to decide if the list is for live items or not')
          .title('Is Live Items'),
      }),
    },
    output: {
      schema: z.object({
        items: z.array(itemSchemaOutput).describe('Array of updated collection items').title('Items'),
      }),
    },
  },
  deleteItems: {
    title: 'Delete Item(s)',
    description: 'Delete one or more items from a collection',
    input: {
      schema: z.object({
        collectionID: z
          .string()
          .min(1, 'Collection ID is required')
          .describe('The ID of your Webflow collection')
          .title('Collection ID'),
        itemIDs: z
          .object({
            items: z.array(
              z.object({
                id: z
                  .string()
                  .min(1, 'Item ID is required')
                  .describe('Unique identifier for the Item')
                  .title('Item ID'),
              })
            ),
          })
          .describe('Array of item IDs to delete')
          .title('Item IDs'),
      }),
    },
    output: {
      schema: z.object({}),
    },
  },
  publishItems: {
    title: 'Publish Item(s)',
    description: 'Publish one or more items in a collection',
    input: {
      schema: z.object({
        collectionID: z
          .string()
          .min(1, 'Collection ID is required')
          .describe('The ID of your Webflow collection')
          .title('Collection ID'),
        itemIds: z
          .array(z.string().min(1, 'Item ID is required').describe('Unique identifier for the Item').title('Item ID'))
          .describe('Array of item IDs to publish')
          .title('Item IDs'),
      }),
    },
    output: {
      schema: z.object({
        publishedItemIds: z.array(z.string()).describe('Array of published item IDs').title('Published Item IDs'),
        errors: z.array(z.string()).describe('Array of errors encountered during publishing').title('Errors'),
      }),
    },
  },
  unpublishLiveItems: {
    title: 'Unpublish Live Item(s)',
    description: 'Unpublish one or more live items in a collection',
    input: {
      schema: z.object({
        collectionID: z
          .string()
          .min(1, 'Collection ID is required')
          .describe('The ID of your Webflow collection')
          .title('Collection ID'),
        itemIds: z
          .array(z.string().min(1, 'Item ID is required').describe('Unique identifier for the Item').title('Item ID'))
          .describe('Array of item IDs to unpublish')
          .title('Item IDs'),
      }),
    },
    output: {
      schema: z.object({}),
    },
  },
} satisfies IntegrationDefinitionProps['actions']
