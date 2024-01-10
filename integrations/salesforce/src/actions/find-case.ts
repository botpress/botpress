import { findCaseInputSchema, findCaseOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'


import { getClient } from '../utils'

export const findCase: Implementation['actions']['findCase'] = async ({ ctx, input, logger }) => {
  const validatedInput = findCaseInputSchema.parse(input)
  const SalesforceClient = await getClient(ctx.configuration)

  let response

  try {
    response = await SalesforceClient.findCase(validatedInput.caseNumber)
    logger.forBot().info(`Successful - Find Case - ${response?.Id}`)
  } catch (error) {
    logger.forBot().debug(`'Find Case' exception ${error}`)
    response = {}
  }

  return findCaseOutputSchema.parse(response)
}
