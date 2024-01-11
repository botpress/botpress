import { getAllListsOutputSchema } from 'src/misc/custom-schemas'
import { getMailchimpClient, parseError } from 'src/utils'
import type { Implementation } from '../misc/types'

export const getAllLists: Implementation['actions']['getAllLists'] = async ({ ctx, logger, input }) => {
  try {
    const mailchimpClient = getMailchimpClient(ctx.configuration)
    const allLists = await mailchimpClient.getAllLists({
      count: input.count || 100,
    })
    return getAllListsOutputSchema.parse(allLists)
  } catch (err) {
    const error = parseError(err)
    logger.forBot().error('Error adding customer to campaign', error)
    throw error
  }
}
