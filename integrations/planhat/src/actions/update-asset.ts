import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'

export const updateAsset: bp.IntegrationProps['actions']['updateAsset'] = async ({ input, ctx, logger }) => {
  logger.forBot().info('Updating asset in Planhat')

  const { apiToken } = ctx.configuration

  const requestBody: any = {}

  if (input.name) {
    requestBody.name = input.name
  }

  if (input.companyId) {
    requestBody.companyId = input.companyId
  }

  if (input.externalId) {
    requestBody.externalId = input.externalId
  }

  if (input.sourceId) {
    requestBody.sourceId = input.sourceId
  }

  if (input.custom) {
    requestBody.custom = input.custom
  }

  const response = await fetch(`https://api.planhat.com/assets/${input.assetId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new sdk.RuntimeError(`Failed to update asset: ${response.status} ${errorText}`)
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
  }
}
