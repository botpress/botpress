import { createContactInputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'


import { getClient } from '../utils'

export const createContact: Implementation['actions']['createContact'] = async ({ ctx, input, logger }) => {
  const validatedInput = createContactInputSchema.parse(input)
  const SalesforceClient = await getClient(ctx.configuration)

  const contactData = {
    FirstName: validatedInput.firstName,
    LastName: validatedInput.lastName,
    AccountId: validatedInput.accountId,
    Email: validatedInput.email,
    Phone: validatedInput.phone || undefined,
  }

  let response
  let returnData

  try {
    response = await SalesforceClient.createContact(contactData)
    if (response.success) {
      logger.forBot().info(`Successful - Create Contact - ${response.id}`)
    }
  } catch (error) {
    logger.forBot().debug(`'Create Contact' exception ${JSON.stringify(error)}`)
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
