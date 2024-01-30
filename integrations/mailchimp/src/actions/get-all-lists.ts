import { getMailchimpClient, parseError } from 'src/utils'
import * as bp from '.botpress'

export const getAllLists: bp.IntegrationProps['actions']['getAllLists'] = async ({ ctx, logger, input }) => {
  try {
    const mailchimpClient = getMailchimpClient(ctx.configuration)
    return await mailchimpClient.getAllLists({
      count: input.count || 100,
    })
  } catch (err) {
    const error = parseError(err)
    logger.forBot().error('Error adding customer to campaign', error)
    throw error
  }
}
