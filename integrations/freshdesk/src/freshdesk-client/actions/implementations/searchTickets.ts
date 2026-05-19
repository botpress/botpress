import { wrapAction } from '../action-wrapper'
import { NUM_TO_PRIORITY, NUM_TO_STATUS, PRIORITY_TO_NUM, STATUS_TO_NUM } from './const'

export const searchTickets = wrapAction(
  { actionName: 'searchTickets', errorMessage: 'Failed to search Freshdesk tickets' },
  async ({ freshdeskClient }, input) => {
    const page = input.nextToken ? Math.max(1, parseInt(input.nextToken, 10) || 1) : 1

    const queryParts: string[] = []
    if (input.agent_id) queryParts.push(`agent_id:${input.agent_id}`)
    if (input.tag) queryParts.push(`tag:'${input.tag.replace(/'/g, "\\'")}'`)
    if (input.status) queryParts.push(`status:${STATUS_TO_NUM[input.status]}`)
    if (input.priority) queryParts.push(`priority:${PRIORITY_TO_NUM[input.priority]}`)

    const toTicket = (t: {
      id: number
      subject: string
      status: number
      priority: number
      created_at: string
      email?: string
    }) => ({
      id: t.id,
      subject: t.subject,
      status: NUM_TO_STATUS[t.status as keyof typeof NUM_TO_STATUS],
      priority: NUM_TO_PRIORITY[t.priority as keyof typeof NUM_TO_PRIORITY],
      createdAt: t.created_at,
      requesterEmail: t.email ?? null,
    })

    if (queryParts.length > 0) {
      const query = queryParts.join(' AND ')
      const { results } = await freshdeskClient.searchTickets({ query, page })
      // Freshdesk search pages are always 30 results max
      const nextToken = results.length === 30 ? String(page + 1) : undefined
      return { tickets: results.map(toTicket), nextToken }
    }

    const limit = Math.min(input.limit ?? 20, 100)
    const raw = await freshdeskClient.listTickets({ per_page: limit, page })
    const nextToken = raw.length === limit ? String(page + 1) : undefined
    return { tickets: raw.map(toTicket), nextToken }
  }
)
