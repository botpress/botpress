import { getClient } from '../client'
import { retrieveCustomerByIdInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'

export const retrieveCustomerById: IntegrationProps['actions']['retrieveCustomerById'] = async ({
  ctx,
  logger,
  input,
}) => {
  const validatedInput = retrieveCustomerByIdInputSchema.parse(input)
  const StripeClient = getClient(ctx.configuration)
  let response
  try {
    const customer = await StripeClient.retrieveCustomer(validatedInput.id)
    response = {
      customer,
    }
    logger.forBot().info(`Successful - Retrieve Customer - ${customer.id}`)
  } catch (error) {
    response = {}
    logger.forBot().debug(`'Create or Retrieve Customer' exception ${JSON.stringify(error)}`)
  }

  return response
}
