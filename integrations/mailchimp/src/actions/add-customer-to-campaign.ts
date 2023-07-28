import type { Implementation } from '../misc/types'

import { addCustomerToCampaignInputSchema } from '../misc/custom-schemas'

import { getMailchimpClient, getValidCustomer } from 'src/utils'

export const addCustomerToCampaign: Implementation['actions']['addCustomerToCampaign'] =
  async ({ ctx, input }) => {
    const validatedInput = addCustomerToCampaignInputSchema.parse(input)
    const mailchimpClient = getMailchimpClient(ctx.configuration)
    const customer = getValidCustomer(validatedInput)

    let response
    const isAlredyAdd = await mailchimpClient.checkIfCustomerInCampaignList(
      validatedInput.campaignId,
      validatedInput.email
    )

    if (!isAlredyAdd) {
      response = await mailchimpClient.addCustomerToCampaignList(
        validatedInput.campaignId,
        customer
      )
    } else {
      response = { message: 'The customer was previously added' }
    }

    return response
  }
