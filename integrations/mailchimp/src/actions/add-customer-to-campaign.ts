import { getMailchimpClient, getValidCustomer } from 'src/utils'
import { addCustomerToCampaignInputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

export const addCustomerToCampaign: Implementation['actions']['addCustomerToCampaign'] =
  async ({ ctx, input, logger }) => {
    const validatedInput = addCustomerToCampaignInputSchema.parse(input)
    const mailchimpClient = getMailchimpClient(ctx.configuration)
    const customer = getValidCustomer(validatedInput)
    let response

    try {
      const isAlredyAdd = await mailchimpClient.checkIfCustomerInCampaignList(
        validatedInput.campaignId,
        validatedInput.email
      )
      let logMessage
      if (!isAlredyAdd) {
        response = await mailchimpClient.addCustomerToCampaignList(
          validatedInput.campaignId,
          customer
        )
      } else {
        logMessage = 'The customer was previously added'
        response = { message: logMessage }
      }
      logger.forBot().info(logMessage)
    } catch (error) {
      logger
        .forBot()
        .debug(`'Add Customer To List' exception ${JSON.stringify(error)}`)
      throw error
    }
    return {
      id: response.id || '',
      email_address: response.email_address || '',
      status: response.status || '',
      list_id: response.list_id || '',
    }
  }
