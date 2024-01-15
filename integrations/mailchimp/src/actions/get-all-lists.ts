import { getMailchimpClient, parseError } from 'src/utils'
import type { Implementation } from '../misc/types'

export const getAllLists: Implementation['actions']['getAllLists'] = async ({ ctx, logger, input }) => {
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
