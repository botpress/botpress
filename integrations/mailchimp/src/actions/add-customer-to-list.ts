import type { Implementation } from '../misc/types'

import { addCustomerToListInputSchema } from '../misc/custom-schemas'

import { getMailchimpClient, getValidCustomer } from 'src/utils'

export const addCustomerToList: Implementation['actions']['addCustomerToList'] =
  async ({ ctx, input }) => {
    const validatedInput = addCustomerToListInputSchema.parse(input)
    const mailchimpClient = getMailchimpClient(ctx.configuration)
    const customer = getValidCustomer(validatedInput)

    let response
    const isAlredyAdd = await mailchimpClient.checkIfCustomerInList(
      validatedInput.listId,
      validatedInput.email
    )

    if (!isAlredyAdd) {
      response = await mailchimpClient.addCustomerToList(
        validatedInput.listId,
        customer
      )
    } else {
      response = { message: 'The customer was previously added' }
    }

    return response
  }
