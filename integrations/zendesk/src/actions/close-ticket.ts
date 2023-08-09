import { getZendeskClient } from '../client'
import type { Implementation } from '../misc/types'

export const closeTicket: Implementation['actions']['closeTicket'] = async ({ ctx, input }) => {
  return getZendeskClient(ctx.configuration).updateTicket(input.ticketId, {
    comment: input.comment,
    status: 'closed',
    author_id: input.authorId, // TODO: use state for this.. don't need to pass all this shit
  })
}
