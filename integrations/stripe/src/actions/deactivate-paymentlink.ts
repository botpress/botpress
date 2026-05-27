import { deactivatePaymentLinkInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'
import { StripeClient } from '../stripe-api/stripe-client'

export const deactivatePaymentLink: IntegrationProps['actions']['deactivatePaymentLink'] = async ({
  ctx,
  client,
  logger,
  input,
}) => {
  const validatedInput = deactivatePaymentLinkInputSchema.parse(input)
  const stripeClient = await StripeClient.createFromStates({ client, ctx, logger })
  let response
  try {
    const paymentLink = await stripeClient.deactivatePaymentLink(validatedInput.id)

    response = {
      id: paymentLink.id,
      url: paymentLink.url,
      active: paymentLink.active,
    }

    logger.forBot().info(`Successful - Deactivate Payment Link - ${paymentLink?.id}`)
  } catch (error) {
    response = {}
    logger.forBot().debug(`'Deactivate Payment Link' exception ${JSON.stringify(error)}`)
  }

  return response
}
