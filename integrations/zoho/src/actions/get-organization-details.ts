import { getClient } from '../client'
import type { IntegrationProps } from '../misc/types'

export const getOrganizationDetails: IntegrationProps['actions']['getOrganizationDetails'] = async ({
  ctx,
  client,
  logger,
}) => {
  const zohoClient = getClient(
    ctx.configuration.refreshToken,
    ctx.configuration.clientId,
    ctx.configuration.clientSecret,
    ctx.configuration.dataCenter,
    ctx,
    client
  )

  try {
    const result = await zohoClient.getOrganizationDetails()

    logger.forBot().info(`Successful - Get Organization Details - ${JSON.stringify(result.data)}`)

    return {
      success: result.success,
      message: result.message,
      data: result.data,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    logger.forBot().error(`'Get Organization Details' exception: ${JSON.stringify(errorMessage)}`)

    return {
      success: false,
      message: errorMessage,
      data: null,
    }
  }
}
