import { getClient } from '../client'
import { findPaymentLinkInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'

export const findPaymentLink: IntegrationProps['actions']['findPaymentLink'] = async ({ ctx, logger, input }) => {
  const validatedInput = findPaymentLinkInputSchema.parse(input)
  const StripeClient = getClient(ctx.configuration)
  let response = {}
  try {
    const paymentLinks = await StripeClient.listAllPaymentLinksBasic()
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
