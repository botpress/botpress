import type { Implementation } from '../misc/types'

import {
  addCustomerToListInputSchema,
  addCustomerOutputSchema,
} from '../misc/custom-schemas'

import { getMailchimpClient, getValidCustomer } from 'src/utils'

export const addCustomerToList: Implementation['actions']['addCustomerToList'] =
  async ({ ctx, input, logger }) => {
    const validatedInput = addCustomerToListInputSchema.parse(input)
    const mailchimpClient = getMailchimpClient(ctx.configuration)
    const customer = getValidCustomer(validatedInput)
    let response
    try {
      const isAlredyAdd = await mailchimpClient.checkIfCustomerInList(
        validatedInput.listId,
        validatedInput.email
      )
      let logMessage
      if (!isAlredyAdd) {
        response = await mailchimpClient.addCustomerToList(
          validatedInput.listId,
          customer
        )
        logMessage = `Added Customer To List with id: ${response?.id} | email address: ${response?.email_address}  | status: ${response?.status} operations`
      } else {
        logMessage = 'The customer was previously added'
        response = { message: logMessage }
      }
      logger.forBot().info(logMessage)
    } catch (error) {
      logger
        .forBot()
        .debug(`'Add Customer To List' exception ${JSON.stringify(error)}`)
      response = {}
    }

    return {
      id: response.id || '',
      email_address: response.email_address || '',
      status: response.status || '',
      list_id: response.list_id || '',
    }
  }
