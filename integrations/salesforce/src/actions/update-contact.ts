import { updateContactInputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'


import { getClient } from '../utils'

export const updateContact: Implementation['actions']['updateContact'] =
  async ({ ctx, input, logger }) => {
    const validatedInput = updateContactInputSchema.parse(input)
    const SalesforceClient = await getClient(ctx.configuration)

    const contactData = {
      FirstName: validatedInput.firstName || undefined,
      LastName: validatedInput.lastName || undefined,
      AccountId: validatedInput.accountId || undefined,
      Email: validatedInput.email || undefined,
      Phone: validatedInput.phone || undefined,
    }

    let response
    let returnData

    try {
      response = await SalesforceClient.updateContact(
        validatedInput.contactId,
        contactData
      )
      if (response.success) {
        logger.forBot().info(`Successful - Update Contact - ${response.id}`)
      }
    } catch (error) {
      logger
        .forBot()
        .debug(`'Update Contact' exception ${JSON.stringify(error)}`)
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
