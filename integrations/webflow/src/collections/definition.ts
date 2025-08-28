import { IntegrationDefinitionProps, z } from '@botpress/sdk'
import { fieldSchemas } from './fields'

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
        collections: z.array(z.any()).describe('Array of collections'),
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
        collectionDetails: z.any().describe('Details of the collection'),
      }),
    },
  },
  createCollection: {
    title: 'Create Collection',
    input: {
      schema: z.object({
        apiTokenOverwrite: z.string().optional().describe('Optional API Token to overwrite the default one'),
        displayName: z
          .string()
          .min(1, 'Display Name is required')
          .describe('The display name of your Webflow collection'),
        singularName: z
          .string()
          .min(1, 'Singular Name is required')
          .describe('The singular name of your Webflow collection'),
        slug: z.string().optional().describe('The slug of your Webflow collection'),
        // TODO: Add fields metadata
        fields: z.array(fieldSchemas),
      }),
    },
    output: {
      schema: z.object({
        // add collections details schema
        collectionDetails: z.any().describe('Details of the new collection'),
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
