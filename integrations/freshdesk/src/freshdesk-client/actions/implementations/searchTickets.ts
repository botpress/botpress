import type { FreshdeskTicket } from '../../types'
import { wrapAction } from '../action-wrapper'
import { NUM_TO_PRIORITY, NUM_TO_STATUS, PRIORITY_TO_NUM, STATUS_TO_NUM } from './utils'

export const searchTickets = wrapAction(
  { actionName: 'searchTickets', errorMessage: 'Failed to search Freshdesk tickets' },
  async ({ freshdeskClient }, input) => {
    const limit = Math.min(input.limit ?? 20, 100)

    const queryParts: string[] = []
    if (input.agent_id) queryParts.push(`agent_id:${input.agent_id}`)
    if (input.tag) queryParts.push(`tag:'${input.tag}'`)
    if (input.status) queryParts.push(`status:${STATUS_TO_NUM[input.status]}`)
    if (input.priority) queryParts.push(`priority:${PRIORITY_TO_NUM[input.priority]}`)

    let rawTickets: FreshdeskTicket[]

    if (queryParts.length > 0) {
      const query = queryParts.join(' AND ')
      const collected: FreshdeskTicket[] = []
      let page = 1
      while (collected.length < limit && page <= 4) {
        const { results } = await freshdeskClient.searchTickets({ query, page })
        collected.push(...results)
        if (results.length < 30) break
        page++
      }
      rawTickets = collected.slice(0, limit)
    } else {
      rawTickets = await freshdeskClient.listTickets({ per_page: limit })
    }

    return {
      tickets: rawTickets.map((t) => ({
        id: t.id,
        subject: t.subject,
        status: NUM_TO_STATUS[t.status as keyof typeof NUM_TO_STATUS] ?? 'open',
        priority: NUM_TO_PRIORITY[t.priority as keyof typeof NUM_TO_PRIORITY] ?? 'medium',
        createdAt: t.created_at,
        requesterEmail: t.email ?? null,
      })),
    }
  }
)
