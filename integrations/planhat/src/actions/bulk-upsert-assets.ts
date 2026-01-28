import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'

export const bulkUpsertAssets: bp.IntegrationProps['actions']['bulkUpsertAssets'] = async ({ input, ctx, logger }) => {
  logger.forBot().info(`Bulk upserting ${input.assets.length} assets in Planhat`)

  const { apiToken } = ctx.configuration

  // Map the input to the API format
  const requestBody = input.assets.map((asset) => {
    const item: any = {}

    if (asset.id) {
      item._id = asset.id
    }

    if (asset.name) {
      item.name = asset.name
    }

    if (asset.companyId) {
      item.companyId = asset.companyId
    }

    if (asset.externalId) {
      item.externalId = asset.externalId
    }

    if (asset.sourceId) {
      item.sourceId = asset.sourceId
    }

    if (asset.custom) {
      item.custom = asset.custom
    }

    return item
  })

  const response = await fetch('https://api.planhat.com/assets', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new sdk.RuntimeError(`Failed to bulk upsert assets: ${response.status} ${errorText}`)
  }

  const data = await response.json()

  return {
    created: data.created || 0,
    updated: data.updated || 0,
    nonupdates: data.nonupdates || 0,
    upsertedIds: data.upsertedIds || [],
    insertsKeys: (data.insertsKeys || []).map((key: any) => ({
      id: key._id,
      sourceId: key.sourceId,
      externalId: key.externalId,
    })),
    updatesKeys: data.updatesKeys || [],
    createdErrors: data.createdErrors || [],
    updatedErrors: data.updatedErrors || [],
    permissionErrors: data.permissionErrors || [],
  }
}
