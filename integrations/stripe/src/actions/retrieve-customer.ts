import { getClient } from '../client'
import { retrieveCustomerByIdInputSchema } from '../misc/custom-schemas'
import * as bp from '.botpress'

export const retrieveCustomerById: bp.IntegrationProps['actions']['retrieveCustomerById'] = async ({
  ctx,
  logger,
  input,
}) => {
  const validatedInput = retrieveCustomerByIdInputSchema.parse(input)
  const StripeClient = getClient(ctx.configuration)

  try {
    const customer = await StripeClient.retrieveCustomer(validatedInput.id)
    if (customer.deleted) {
      logger.forBot().info(`Customer not found - Retrieve Customer - ${validatedInput.id}`)
      return {}
    }

    logger.forBot().info(`Successful - Retrieve Customer - ${customer.id}`)
    return customer
  } catch (error) {
    logger.forBot().debug(`'Create or Retrieve Customer' exception ${JSON.stringify(error)}`)
    return {}
  }
}
