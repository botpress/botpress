import { updateCaseInputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'


import { getClient } from '../utils'

export const updateCase: Implementation['actions']['updateCase'] = async ({ ctx, input, logger }) => {
  const validatedInput = updateCaseInputSchema.parse(input)
  const SalesforceClient = await getClient(ctx.configuration)

  const caseData = {
    Subject: validatedInput.subject || undefined,
    SuppliedName: validatedInput.suppliedName || undefined,
    Description: validatedInput.description || undefined,
    Priority: validatedInput.priority || undefined,
    Status: validatedInput.status || undefined,
    Origin: validatedInput.origin || undefined,
  }

  let response
  let returnData

  try {
    response = await SalesforceClient.updateCase(validatedInput.caseId, caseData)
    if (response.success) {
      logger.forBot().info(`Successful - Update Case - ${response.id}`)
    }
  } catch (error) {
    logger.forBot().debug(`'Update Case' exception ${JSON.stringify(error)}`)
  }

  if (response?.success) {
    returnData = {
      id: response.id,
    }
  } else {
    returnData = response || {}
  }

  return returnData
}
