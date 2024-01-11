import { getMailchimpClient, getValidCustomer } from 'src/utils'
import type { Implementation } from '../misc/types'

export const getAllLists: Implementation['actions']['getAllLists'] = async ({ ctx, logger, input }) => {
  try {
    const mailchimpClient = getMailchimpClient(ctx.configuration)
    return mailchimpClient.getAllLists({
      count: input.count,
    })
  } catch (error) {
    throw error
  }
}
