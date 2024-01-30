import { getMailchimpClient, getValidCustomer, parseError } from 'src/utils'
import { addCustomerOutputSchema, addCustomerToCampaignInputSchema } from '../misc/custom-schemas'
import * as bp from '.botpress'

export const addCustomerToCampaign: bp.IntegrationProps['actions']['addCustomerToCampaign'] = async ({
  ctx,
  logger,
  input,
}) => {
  try {
    const mailchimpClient = getMailchimpClient(ctx.configuration, logger)
    const validatedInput = addCustomerToCampaignInputSchema.parse(input)
    const customer = getValidCustomer(validatedInput)

    const response = await mailchimpClient.addCustomerToCampaignList(validatedInput.campaignId, customer)

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
