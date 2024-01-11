import { getAllCampaignsOutputSchema } from 'src/misc/custom-schemas'
import { getMailchimpClient, parseError } from 'src/utils'
import type { Implementation } from '../misc/types'

export const getAllCampaigns: Implementation['actions']['getAllCampaigns'] = async ({ ctx, logger, input }) => {
  try {
    const mailchimpClient = getMailchimpClient(ctx.configuration)
    const allLists = await mailchimpClient.getAllLists({
      count: input.count || 100,
    })
    return getAllCampaignsOutputSchema.parse(allLists)
  } catch (err) {
    const error = parseError(err)
    logger.forBot().error('Error adding customer to campaign', error)
    throw error
  }
}
