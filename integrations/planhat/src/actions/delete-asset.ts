import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'

export const deleteAsset: bp.IntegrationProps['actions']['deleteAsset'] = async ({ input, ctx, logger }) => {
  logger.forBot().info('Deleting asset from Planhat')

  const { apiToken } = ctx.configuration

  const response = await fetch(`https://api.planhat.com/assets/${input.assetId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new sdk.RuntimeError(`Failed to delete asset: ${response.status} ${errorText}`)
  }

  const data = await response.json()

  return {
    success: data.ok === 1,
    deletedCount: data.deletedCount || 0,
  }
}
