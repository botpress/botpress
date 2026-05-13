import { wrapAction } from '../action-wrapper'
import { NUM_TO_PRIORITY, NUM_TO_STATUS } from './utils'

export const listTickets = wrapAction(
  { actionName: 'listTickets', errorMessage: 'Failed to list Freshdesk tickets' },
  async ({ freshdeskClient }, input) => {
    const raw = await freshdeskClient.listTickets(input)
    const tickets = raw.map((t) => ({
      ...t,
      status: NUM_TO_STATUS[t.status as keyof typeof NUM_TO_STATUS] ?? 'open',
      priority: NUM_TO_PRIORITY[t.priority as keyof typeof NUM_TO_PRIORITY] ?? 'medium',
    }))
    return { tickets }
  }
)
