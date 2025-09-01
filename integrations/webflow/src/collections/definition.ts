import { IntegrationDefinitionProps, z } from '@botpress/sdk'
import { CollectionSchema, CollectionDetailsSchema } from './collection'

export const collectionsActionsDefinitions = {
  listCollections: {
    title: 'List Collections',
    input: {
      schema: z.object({
        apiTokenOverwrite: z.string().optional().describe('Optional API Token to overwrite the default one'),
      }),
    },
    output: {
      schema: z.object({
        // add collections schema
        collections: z.array(CollectionSchema).describe('Array of collections'),
      }),
    },
  },
  getCollectionDetails: {
    title: 'Get Collection Details',
    input: {
      schema: z.object({
        apiTokenOverwrite: z.string().optional().describe('Optional API Token to overwrite the default one'),
        collectionID: z.string().min(1, 'Collection ID is required').describe('The ID of your Webflow collection'),
      }),
    },
    output: {
      schema: z.object({
        // add collections details schema
        collectionDetails: CollectionDetailsSchema.describe('Details of the collection'),
      }),
    },
  },
  createCollection: {
    title: 'Create Collection',
    input: {
      schema: z.object({
        apiTokenOverwrite: z.string().optional().describe('Optional API Token to overwrite the default one'),
        collectionInfo: CollectionSchema.describe("Informations of the collection to create.")
      }),
    },
    output: {
      schema: z.object({
        // add collections details schema
        collectionDetails: CollectionDetailsSchema.describe('Details of the new collection'),
      }),
    },
  },
  deleteCollection: {
    title: 'Delete Collection',
    input: {
      schema: z.object({
        apiTokenOverwrite: z.string().optional().describe('Optional API Token to overwrite the default one'),
        collectionID: z.string().min(1, 'Collection ID is required').describe('The ID of your Webflow collection'),
      }),
    },
    output: {
      schema: z.object({ success: z.boolean().describe('Indicates if the collection was successfully deleted') }),
    },
  },
} satisfies IntegrationDefinitionProps['actions']
