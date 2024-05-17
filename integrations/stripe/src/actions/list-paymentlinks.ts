import { getClient } from '../client'
import type { IntegrationProps } from '../misc/types'

export const listPaymentLinks: IntegrationProps['actions']['listPaymentLinks'] = async ({ ctx, logger }) => {
  const StripeClient = getClient(ctx.configuration)
  let response
  try {
    const paymentLinks = await StripeClient.listAllPaymentLinksBasic()

    response = {
      paymentLinks,
    }
    logger.forBot().info(`Successful - List Payment Links - Total Active: ${paymentLinks.length}`)
  } catch (error) {
    response = {}
    logger.forBot().debug(`'List Payment Links' exception ${JSON.stringify(error)}`)
  }

  return response
}
