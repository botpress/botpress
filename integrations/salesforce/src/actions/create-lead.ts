import { createLeadInputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'


import { getClient } from '../utils'

export const createLead: Implementation['actions']['createLead'] = async ({ ctx, input, logger }) => {
  const validatedInput = createLeadInputSchema.parse(input)
  const SalesforceClient = await getClient(ctx.configuration)

  const leadData = {
    FirstName: validatedInput.firstName,
    LastName: validatedInput.lastName,
    Company: validatedInput.company,
    Email: validatedInput.email,
    Phone: validatedInput.phone || undefined,
  }

  let response
  let returnData

  try {
    response = await SalesforceClient.createLead(leadData)
    if (response.success) {
      logger.forBot().info(`Successful - Create Lead - ${response.id}`)
    }
  } catch (error) {
    logger.forBot().debug(`'Create Lead' exception ${JSON.stringify(error)}`)
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
