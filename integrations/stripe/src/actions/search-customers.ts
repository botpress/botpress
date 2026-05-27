import { searchCustomersInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'
import { StripeClient } from '../stripe-api/stripe-client'

export const searchCustomers: IntegrationProps['actions']['searchCustomers'] = async ({
  ctx,
  client,
  logger,
  input,
}) => {
  const validatedInput = searchCustomersInputSchema.parse(input)
  const stripeClient = await StripeClient.createFromStates({ client, ctx, logger })
  let response
  try {
    const customers = await stripeClient.searchCustomers(
      validatedInput.email,
      validatedInput.name,
      validatedInput.phone
    )

    response = {
      customers,
    }
    logger.forBot().info('Successful - Search Customers')
  } catch (error) {
    response = {}
    logger.forBot().debug(`'Search Customers' exception ${JSON.stringify(error)}`)
  }

  return response
}
