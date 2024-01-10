import { findContactInputSchema, findContactOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'


import { getClient } from '../utils'

export const findContact: Implementation['actions']['findContact'] = async ({ ctx, input, logger }) => {
  const validatedInput = findContactInputSchema.parse(input)
  const SalesforceClient = await getClient(ctx.configuration)

  let response

  try {
    response = await SalesforceClient.findContact(validatedInput.email)
    logger.forBot().info(`Successful - Find Contact - ${response?.Id}`)
  } catch (error) {
    logger.forBot().debug(`'Find Contact' exception ${error}`)
    response = {}
  }

  return findContactOutputSchema.parse(response)
}
