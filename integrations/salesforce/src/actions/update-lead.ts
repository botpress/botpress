import { updateLeadInputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

import { getClient } from '../utils'

export const updateLead: Implementation['actions']['updateLead'] = async ({ ctx, input, logger }) => {
  const validatedInput = updateLeadInputSchema.parse(input)
  const SalesforceClient = await getClient(ctx.configuration)

  const leadData = {
    FirstName: validatedInput.firstName || undefined,
    LastName: validatedInput.lastName || undefined,
    Company: validatedInput.company || undefined,
    Email: validatedInput.email || undefined,
    Phone: validatedInput.phone || undefined,
    Status: validatedInput.status || undefined,
  }

  let response
  let returnData

  try {
    response = await SalesforceClient.updateLead(validatedInput.leadId, leadData)
    if (response.success) {
      logger.forBot().info(`Successful - Update Lead - ${response.id}`)
    }
  } catch (error) {
    logger.forBot().debug(`'Update Lead' exception ${JSON.stringify(error)}`)
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
