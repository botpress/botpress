import { getMailchimpClient } from 'src/utils'
import { sendMassEmailCampaignInputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

export const sendMassEmailCampaign: Implementation['actions']['sendMassEmailCampaign'] =
  async ({ ctx, input, logger }) => {
    const validatedInput = sendMassEmailCampaignInputSchema.parse(input)
    const mailchimpClient = getMailchimpClient(ctx.configuration)
    let response
    try {
      response = await mailchimpClient.sendMassEmailCampaign(
        validatedInput.campaignIds
      )
      logger
        .forBot()
        .info(
          `Batch operation with id: ${response?.id} has triggered ${response?.total_operations} operations`
        )
    } catch (error) {
      logger
        .forBot()
        .debug(`'Send Mass Email Campaign' exception ${JSON.stringify(error)}`)
      response = {}
    }

    return {
      id: response?.id,
      status: response?.status,
      total_operations: response?.total_operations,
      _links: response?._links,
    }
  }
