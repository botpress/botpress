import { findPaymentLinkInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'
import { StripeClient } from '../stripe-api/stripe-client'

export const findPaymentLink: IntegrationProps['actions']['findPaymentLink'] = async ({
  ctx,
  client,
  logger,
  input,
}) => {
  const validatedInput = findPaymentLinkInputSchema.parse(input)
  const stripeClient = await StripeClient.createFromStates({ client, ctx, logger })
  let response = {}
  try {
    const paymentLinks = await stripeClient.listAllPaymentLinksBasic()
    const paymentLink = paymentLinks.find((link) => link.url === validatedInput.url)

    if (paymentLink) {
      response = {
        id: paymentLink.id,
      }
    }

    logger.forBot().info(`Successful - Find Payment Link - ${paymentLink?.id}`)
  } catch (error) {
    logger.forBot().debug(`'Find Payment Link' exception ${JSON.stringify(error)}`)
  }

  return response
}
