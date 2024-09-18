import { getMailchimpClient, parseError } from 'src/utils'
import * as bp from '.botpress'

export const getAllCampaigns: bp.IntegrationProps['actions']['getAllCampaigns'] = async ({ ctx, logger, input }) => {
  try {
    const mailchimpClient = getMailchimpClient(ctx.configuration, logger)
    const allCampaigns = await mailchimpClient.getAllCampaigns({
      count: input.count || 100,
    })
    return allCampaigns as bp.actions.getAllCampaigns.output.Output
  } catch (err) {
    const error = parseError(err)
    logger.forBot().error('Error adding customer to campaign', error)
    throw error
  }
}
