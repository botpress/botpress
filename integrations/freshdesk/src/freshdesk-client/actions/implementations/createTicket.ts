import { wrapAction } from '../action-wrapper'
import { NUM_TO_PRIORITY, NUM_TO_STATUS, PRIORITY_TO_NUM, STATUS_TO_NUM } from './const'

export const createTicket = wrapAction(
  { actionName: 'createTicket', errorMessage: 'Failed to create Freshdesk ticket' },
  async ({ freshdeskClient, ctx }, input) => {
    const ticket = await freshdeskClient.createTicket({
      subject: input.subject,
      description: input.description,
      email: input.email,
      priority: PRIORITY_TO_NUM[input.priority ?? 'medium'],
      status: STATUS_TO_NUM[input.status ?? 'open'],
      tags: input.tags,
      custom_fields: input.custom_fields,
    })

    return {
      id: ticket.id,
      subject: ticket.subject,
      status: NUM_TO_STATUS[ticket.status as keyof typeof NUM_TO_STATUS],
      priority: NUM_TO_PRIORITY[ticket.priority as keyof typeof NUM_TO_PRIORITY],
      createdAt: ticket.created_at,
      url: `https://${ctx.configuration.domain}.freshdesk.com/helpdesk/tickets/${ticket.id}`,
    }
  }
)
