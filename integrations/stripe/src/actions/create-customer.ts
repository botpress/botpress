import { getClient } from '../client'
import { createCustomerInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'

export const createCustomer: IntegrationProps['actions']['createCustomer'] = async ({ ctx, logger, input }) => {
  const validatedInput = createCustomerInputSchema.parse(input)
  const StripeClient = getClient(ctx.configuration)
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
    const customer = await StripeClient.createCustomer(params)

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
