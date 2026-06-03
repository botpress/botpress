import { createOrRetrieveCustomerInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'
import { StripeClient } from '../stripe-api/stripe-client'

export const createOrRetrieveCustomer: IntegrationProps['actions']['createOrRetrieveCustomer'] = async ({
  ctx,
  client,
  logger,
  input,
}) => {
  const validatedInput = createOrRetrieveCustomerInputSchema.parse(input)
  const stripeClient = await StripeClient.createFromStates({ client, ctx, logger })
  let response
  try {
    const customers = await stripeClient.searchCustomers(validatedInput.email)
    let customer
    if (customers.length === 0) {
      const params = {
        email: validatedInput.email,
        name: validatedInput.name,
        phone: validatedInput.phone,
        description: validatedInput.description,
        payment_method: validatedInput.paymentMethodId,
        address: validatedInput.address ? JSON.parse(validatedInput.address) : undefined,
      }
      customer = await stripeClient.createCustomer(params)
      response = { customer }
    } else {
      response = customers.length === 1 ? { customer: customers[0] } : { customers }
    }
    logger.forBot().info(`Successful - Create or Retrieve Customer ${customer ? customer.id : ''}`)
  } catch (error) {
    response = {}
    logger.forBot().debug(`'Create or Retrieve Customer' exception ${JSON.stringify(error)}`)
  }

  return response
}
