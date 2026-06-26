import { retrieveCustomerByIdInputSchema } from '../misc/custom-schemas'
import { StripeClient } from '../stripe-api/stripe-client'
import * as bp from '.botpress'

export const retrieveCustomerById: bp.IntegrationProps['actions']['retrieveCustomerById'] = async ({
  ctx,
  client,
  logger,
  input,
}) => {
  const validatedInput = retrieveCustomerByIdInputSchema.parse(input)
  const stripeClient = await StripeClient.createFromStates({ client, ctx, logger })

  try {
    const customer = await stripeClient.retrieveCustomer(validatedInput.id)
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
