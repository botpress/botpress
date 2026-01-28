import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'

export const createAsset: bp.IntegrationProps['actions']['createAsset'] = async ({ input, ctx, logger }) => {
  logger.forBot().info('Creating asset in Planhat')

  const { apiToken } = ctx.configuration

  const requestBody: any = {
    name: input.name,
    companyId: input.companyId,
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

  const response = await fetch('https://api.planhat.com/assets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new sdk.RuntimeError(`Failed to create asset: ${response.status} ${errorText}`)
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
