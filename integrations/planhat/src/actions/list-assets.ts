import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'

export const listAssets: bp.IntegrationProps['actions']['listAssets'] = async ({ input, ctx, logger }) => {
  logger.forBot().info('Listing assets from Planhat')

  const { apiToken } = ctx.configuration

  // Build query parameters
  const queryParams = new URLSearchParams()

  if (input.companyId) {
    queryParams.append('companyId', input.companyId)
  }

  if (input.limit !== undefined) {
    queryParams.append('limit', input.limit.toString())
  }

  if (input.offset !== undefined) {
    queryParams.append('offset', input.offset.toString())
  }

  if (input.sort) {
    queryParams.append('sort', input.sort)
  }

  if (input.select) {
    queryParams.append('select', input.select)
  }

  const queryString = queryParams.toString()
  const url = `https://api.planhat.com/assets${queryString ? `?${queryString}` : ''}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new sdk.RuntimeError(`Failed to list assets: ${response.status} ${errorText}`)
  }

  const data = await response.json()

  // Map the array response to the expected format
  const assets = data.map((asset: any) => ({
    id: asset._id || asset.id,
    name: asset.name,
    companyId: asset.companyId,
    companyName: asset.companyName,
    externalId: asset.externalId,
    sourceId: asset.sourceId,
    custom: asset.custom,
    usage: asset.usage,
  }))

  return { assets }
}
