export const HITL_TICKET_TAG = 'botpress-hitl'

export const isHitlTicket = (ticket: { tags?: string[] | null }) => ticket.tags?.includes(HITL_TICKET_TAG) ?? false
