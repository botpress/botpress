import { getClient } from '../client'
import { searchCustomersInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'

export const searchCustomers: IntegrationProps['actions']['searchCustomers'] = async ({ ctx, logger, input }) => {
  const validatedInput = searchCustomersInputSchema.parse(input)
  const StripeClient = getClient(ctx.configuration)
  let response
  try {
    const customers = await StripeClient.searchCustomers(
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
