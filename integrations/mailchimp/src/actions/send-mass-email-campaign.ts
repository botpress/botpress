import { RuntimeError } from '@botpress/sdk'
import { sendMassEmailCampaignInputSchema, sendMassEmailCampaignOutputSchema } from '../misc/custom-schemas'
import { getMailchimpClient, parseError } from '../utils'
import * as bp from '.botpress'

export const sendMassEmailCampaign: bp.IntegrationProps['actions']['sendMassEmailCampaign'] = async ({
  ctx,
  input,
  logger,
}) => {
  try {
    const validatedInput = sendMassEmailCampaignInputSchema.parse(input)
    const mailchimpClient = getMailchimpClient(ctx.configuration, logger)
    const response = await mailchimpClient.sendMassEmailCampaign(validatedInput.campaignIds)

    if (typeof response === 'undefined') {
      throw new RuntimeError('Batch client is not available')
    }

    return sendMassEmailCampaignOutputSchema.parse({
      id: response.id,
      status: response.status,
      total_operations: response.total_operations,
      _links: response._links,
    })
  } catch (err) {
    const error = parseError(err)
    logger.forBot().error('Error adding customer to campaign', error)
    throw error
  }
}
