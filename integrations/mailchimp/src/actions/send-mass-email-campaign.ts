import type { Implementation } from '../misc/types'

import {
  sendMassEmailCampaignInputSchema,
  sendMassEmailCampaignOutputSchema,
} from '../misc/custom-schemas'

import { getMailchimpClient } from 'src/utils'

export const sendMassEmailCampaign: Implementation['actions']['sendMassEmailCampaign'] =
  async ({ ctx, input }) => {
    const validatedInput = sendMassEmailCampaignInputSchema.parse(input)
    const mailchimpClient = getMailchimpClient(ctx.configuration)

    const response = await mailchimpClient.sendMassEmailCampaign(
      validatedInput.campaignIds
    )

    return sendMassEmailCampaignOutputSchema.parse(response)
  }
