import { getClient } from '../client'
import { createOrRetrieveCustomerInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'

export const createOrRetrieveCustomer: IntegrationProps['actions']['createOrRetrieveCustomer'] = async ({
  ctx,
  logger,
  input,
}) => {
  const validatedInput = createOrRetrieveCustomerInputSchema.parse(input)
  const StripeClient = getClient(ctx.configuration)
  let response
  try {
    const customers = await StripeClient.searchCustomers(validatedInput.email)
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
      customer = await StripeClient.createCustomer(params)
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
