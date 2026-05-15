import { wrapAction } from '../action-wrapper'
import { NUM_TO_PRIORITY, NUM_TO_STATUS } from './const'

export const listTickets = wrapAction(
  { actionName: 'listTickets', errorMessage: 'Failed to list Freshdesk tickets' },
  async ({ freshdeskClient }, input) => {
    const page = input.nextToken ? Math.max(1, parseInt(input.nextToken, 10) || 1) : 1
    const perPage = input.per_page && input.per_page > 0 ? input.per_page : 30
    const raw = await freshdeskClient.listTickets({
      filter: input.filter,
      order_by: input.order_by,
      order_type: input.order_type,
      page,
      per_page: perPage,
    })
    const tickets = raw.map((t) => ({
      ...t,
      status: NUM_TO_STATUS[t.status as keyof typeof NUM_TO_STATUS],
      priority: NUM_TO_PRIORITY[t.priority as keyof typeof NUM_TO_PRIORITY],
    }))
    const nextToken = raw.length === perPage ? String(page + 1) : undefined
    return { tickets, nextToken }
  }
)
