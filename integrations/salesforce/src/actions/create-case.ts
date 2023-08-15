import type { Implementation } from '../misc/types'

import { createCaseInputSchema } from '../misc/custom-schemas'

import { getClient } from '../utils'

export const createCase: Implementation['actions']['createCase'] = async ({
  ctx,
  input,
  logger,
}) => {
  const validatedInput = createCaseInputSchema.parse(input)

  const SalesforceClient = getClient(ctx.configuration)

  const caseData = {
    Subject: validatedInput.subject,
    SuppliedName: validatedInput.suppliedName,
    Description: validatedInput.description || undefined,
    Priority: validatedInput.priority || undefined,
    Origin: `Botpress: bot ${validatedInput.botId || ''}`,
  }

  let response
  let returnData

  try {
    response = await SalesforceClient.createCase(caseData)
    if (response.success) {
      logger.forBot().info(`Successful - Create Case - ${response.id}`)
    }
  } catch (error) {
    logger.forBot().debug(`'Create Case' exception ${JSON.stringify(error)}`)
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
