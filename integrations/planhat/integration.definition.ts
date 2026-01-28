import { z, IntegrationDefinition } from '@botpress/sdk'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      apiToken: z.string().secret().min(1).describe('Your Planhat API Token').title('API Token'),
    }),
  },
  actions: {
    createAsset: {
      title: 'Create Asset',
      description: 'Creates a new asset in Planhat',
      input: {
        schema: z.object({
          name: z.string().min(1).describe('The name of the asset').title('Asset Name'),
          companyId: z.string().min(1).describe('The company ID. Can also use "extid-[externalId]" or "srcid-[sourceId]" format').title('Company ID'),
          externalId: z.string().optional().describe('External identifier for the asset').title('External ID'),
          sourceId: z.string().optional().describe('Source identifier for the asset').title('Source ID'),
          custom: z.record(z.any()).optional().describe('Custom fields as key-value pairs').title('Custom Fields'),
        }),
      },
      output: {
        schema: z.object({
          id: z.string().describe('The ID of the created asset'),
          name: z.string().describe('The name of the created asset'),
          companyId: z.string().describe('The company ID'),
          companyName: z.string().optional().describe('The name of the company'),
          externalId: z.string().optional().describe('External ID if provided'),
          sourceId: z.string().optional().describe('Source ID if provided'),
          custom: z.record(z.any()).optional().describe('Custom fields that were set'),
        }),
      },
    },
    updateAsset: {
      title: 'Update Asset',
      description: 'Updates an existing asset in Planhat',
      input: {
        schema: z.object({
          assetId: z.string().min(1).describe('The asset ID, externalId (prefixed with "extid-"), or sourceId (prefixed with "srcid-")').title('Asset ID'),
          name: z.string().optional().describe('The name of the asset').title('Asset Name'),
          companyId: z.string().optional().describe('The company ID. Can also use "extid-[externalId]" or "srcid-[sourceId]" format').title('Company ID'),
          externalId: z.string().optional().describe('External identifier for the asset').title('External ID'),
          sourceId: z.string().optional().describe('Source identifier for the asset').title('Source ID'),
          custom: z.record(z.any()).optional().describe('Custom fields as key-value pairs').title('Custom Fields'),
        }),
      },
      output: {
        schema: z.object({
          id: z.string().describe('The ID of the updated asset'),
          name: z.string().describe('The name of the asset'),
          companyId: z.string().describe('The company ID'),
          companyName: z.string().optional().describe('The name of the company'),
          externalId: z.string().optional().describe('External ID if set'),
          sourceId: z.string().optional().describe('Source ID if set'),
          custom: z.record(z.any()).optional().describe('Custom fields'),
        }),
      },
    },
  },
})
