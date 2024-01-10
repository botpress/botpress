import { createCaseInputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'
import { getClient } from '../utils'

export const createCase: Implementation['actions']['createCase'] = async ({ ctx, input, logger }) => {
  const validatedInput = createCaseInputSchema.parse(input)
  const SalesforceClient = await getClient(ctx.configuration)

  const caseData = {
    Subject: validatedInput.subject,
    SuppliedName: validatedInput.suppliedName,
    Description: validatedInput.description || undefined,
    Priority: validatedInput.priority || undefined,
    Origin: `Botpress: bot ${validatedInput.botId || ''}`,
  }

  const response = await SalesforceClient.createCase(caseData, logger)

  if (response?.success) {
    logger.forBot().info(`Successful - Create Case - ${response.id}`)
    return {
      id: response.id,
    }
  }

  logger.forBot().debug(`'Create Case' exception ${JSON.stringify(response.errors)}`)
  return response || {}
}
