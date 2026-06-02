import type { IntegrationProps } from '../misc/types'
import { StripeClient } from '../stripe-api/stripe-client'

export const listPaymentLinks: IntegrationProps['actions']['listPaymentLinks'] = async ({ ctx, client, logger }) => {
  const stripeClient = await StripeClient.createFromStates({ client, ctx, logger })
  let response
  try {
    const paymentLinks = await stripeClient.listAllPaymentLinksBasic()

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
