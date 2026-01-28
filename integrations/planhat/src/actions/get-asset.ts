import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'

export const getAsset: bp.IntegrationProps['actions']['getAsset'] = async ({ input, ctx, logger }) => {
  logger.forBot().info('Getting asset from Planhat')

  const { apiToken } = ctx.configuration

  const response = await fetch(`https://api.planhat.com/assets/${input.assetId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new sdk.RuntimeError(`Failed to get asset: ${response.status} ${errorText}`)
  }

  const data = await response.json()

  return {
    id: data._id || data.id,
    name: data.name,
    companyId: data.companyId,
    companyName: data.companyName,
    externalId: data.externalId,
    sourceId: data.sourceId,
    custom: data.custom,
    usage: data.usage,
  }
}
