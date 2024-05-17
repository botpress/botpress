import { getClient } from '../client'
import { deactivatePaymentLinkInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'

export const deactivatePaymentLink: IntegrationProps['actions']['deactivatePaymentLink'] = async ({
  ctx,
  logger,
  input,
}) => {
  const validatedInput = deactivatePaymentLinkInputSchema.parse(input)
  const StripeClient = getClient(ctx.configuration)
  let response
  try {
    const paymentLink = await StripeClient.deactivatePaymentLink(validatedInput.id)

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
