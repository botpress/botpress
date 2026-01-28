import { z, IntegrationDefinition } from '@botpress/sdk'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.1.1',
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
    getAsset: {
      title: 'Get Asset',
      description: 'Retrieves a specific asset from Planhat',
      input: {
        schema: z.object({
          assetId: z.string().min(1).describe('The asset ID, externalId (prefixed with "extid-"), or sourceId (prefixed with "srcid-")').title('Asset ID'),
        }),
      },
      output: {
        schema: z.object({
          id: z.string().describe('The ID of the asset'),
          name: z.string().describe('The name of the asset'),
          companyId: z.string().describe('The company ID'),
          companyName: z.string().optional().describe('The name of the company'),
          externalId: z.string().optional().describe('External ID if set'),
          sourceId: z.string().optional().describe('Source ID if set'),
          custom: z.record(z.any()).optional().describe('Custom fields'),
          usage: z.record(z.any()).optional().describe('Usage data'),
        }),
      },
    },
    listAssets: {
      title: 'List Assets',
      description: 'Retrieves a list of assets from Planhat with optional filtering and pagination',
      input: {
        schema: z.object({
          companyId: z.string().optional().describe('Filter assets by company ID').title('Company ID'),
          limit: z.number().min(1).max(2000).optional().describe('Limit the number of results (default: 100, max: 2000)').title('Limit'),
          offset: z.number().min(0).optional().describe('Offset for pagination (default: 0)').title('Offset'),
          sort: z.string().optional().describe('Sort by property. Prefix with "-" for descending order (e.g., "-name")').title('Sort'),
          select: z.string().optional().describe('Comma-separated list of properties to include (e.g., "_id,name,companyId")').title('Select Fields'),
        }),
      },
      output: {
        schema: z.object({
          assets: z.array(
            z.object({
              id: z.string().describe('The ID of the asset'),
              name: z.string().optional().describe('The name of the asset'),
              companyId: z.string().optional().describe('The company ID'),
              companyName: z.string().optional().describe('The name of the company'),
              externalId: z.string().optional().describe('External ID if set'),
              sourceId: z.string().optional().describe('Source ID if set'),
              custom: z.record(z.any()).optional().describe('Custom fields'),
              usage: z.record(z.any()).optional().describe('Usage data'),
            })
          ).describe('Array of assets'),
        }),
      },
    },
    deleteAsset: {
      title: 'Delete Asset',
      description: 'Deletes an asset from Planhat',
      input: {
        schema: z.object({
          assetId: z.string().min(1).describe('The asset ID to delete').title('Asset ID'),
        }),
      },
      output: {
        schema: z.object({
          success: z.boolean().describe('Whether the deletion was successful'),
          deletedCount: z.number().describe('Number of assets deleted'),
        }),
      },
    },
    bulkUpsertAssets: {
      title: 'Bulk Upsert Assets',
      description: 'Create and/or update multiple assets in a single request (max 5,000 items)',
      input: {
        schema: z.object({
          assets: z.array(
            z.object({
              id: z.string().optional().describe('Asset ID for updates').title('ID'),
              name: z.string().optional().describe('The name of the asset (required for creation)').title('Asset Name'),
              companyId: z.string().optional().describe('The company ID. Can also use "extid-[externalId]" or "srcid-[sourceId]" format').title('Company ID'),
              externalId: z.string().optional().describe('External identifier for the asset').title('External ID'),
              sourceId: z.string().optional().describe('Source identifier for the asset').title('Source ID'),
              custom: z.record(z.any()).optional().describe('Custom fields as key-value pairs').title('Custom Fields'),
            })
          ).min(1).max(5000).describe('Array of assets to create or update (max 5,000)').title('Assets'),
        }),
      },
      output: {
        schema: z.object({
          created: z.number().describe('Number of assets created'),
          updated: z.number().describe('Number of assets updated'),
          nonupdates: z.number().describe('Number of assets that were not updated'),
          upsertedIds: z.array(z.string()).describe('Array of IDs for all upserted assets'),
          insertsKeys: z.array(
            z.object({
              id: z.string().optional(),
              sourceId: z.string().optional(),
              externalId: z.string().optional(),
            })
          ).describe('Keys for newly created assets'),
          updatesKeys: z.array(z.any()).describe('Keys for updated assets'),
          createdErrors: z.array(z.any()).describe('Errors during creation'),
          updatedErrors: z.array(z.any()).describe('Errors during updates'),
          permissionErrors: z.array(z.any()).describe('Permission errors'),
        }),
      },
    },
  },
})
