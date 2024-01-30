import { getMailchimpClient, getValidCustomer, parseError } from 'src/utils'
import { addCustomerOutputSchema, addCustomerToListInputSchema } from '../misc/custom-schemas'
import * as bp from '.botpress'

export const addCustomerToList: bp.IntegrationProps['actions']['addCustomerToList'] = async ({
  ctx,
  input,
  logger,
}) => {
  try {
    const validatedInput = addCustomerToListInputSchema.parse(input)
    const mailchimpClient = getMailchimpClient(ctx.configuration, logger)
    const customer = getValidCustomer(validatedInput)

    const response = await mailchimpClient.addCustomerToList(validatedInput.listId, customer)

    return addCustomerOutputSchema.parse({
      email_address: response.email_address,
      status: response.status,
      list_id: response.list_id,
      id: response.id,
    })
  } catch (err: any) {
    const error = parseError(err)
    logger.forBot().error('Error adding customer to campaign', error)
    throw error
  }
}
