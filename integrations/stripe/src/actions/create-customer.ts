import { createCustomerInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'
import { StripeClient } from '../stripe-api/stripe-client'

export const createCustomer: IntegrationProps['actions']['createCustomer'] = async ({ ctx, client, logger, input }) => {
  const validatedInput = createCustomerInputSchema.parse(input)
  const stripeClient = await StripeClient.createFromStates({ client, ctx, logger })
  let response
  try {
    const params = {
      email: validatedInput.email,
      name: validatedInput.name,
      phone: validatedInput.phone,
      description: validatedInput.description,
      payment_method: validatedInput.paymentMethodId,
      address: validatedInput.address ? JSON.parse(validatedInput.address) : undefined,
    }
    const customer = await stripeClient.createCustomer(params)

    response = {
      customer,
    }
    logger.forBot().info(`Successful - Create Customer - ${customer.id}`)
  } catch (error) {
    response = {}
    logger.forBot().debug(`'Create Customer' exception ${JSON.stringify(error)}`)
  }

  return response
}
