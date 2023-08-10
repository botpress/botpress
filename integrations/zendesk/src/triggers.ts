const TRIGGER_NAMES = ['TicketAssigned', 'TicketSolved', 'NewMessage'] as const
export type TriggerNames = (typeof TRIGGER_NAMES)[number]
export type TriggerPayload = ReturnType<typeof getTriggerTemplate>

export const getTriggerTemplate = (name: TriggerNames) => ({
  type: name,
  agent: '{{current_user.email}}',
  comment: '{{ticket.latest_public_comment_html}}',
  ticketId: '{{ticket.id}}',
  currentUser: {
    id: '{{current_user.id}}',
    name: '{{current_user.name}}',
    email: '{{current_user.email}}',
    external_id: '{{current_user.external_id}}',
    role: '{{current_user.role}}',
  },
})

export const TRIGGERS: Record<TriggerNames, any> = {
  TicketAssigned: {
    conditions: {
      all: [
        {
          field: 'assignee_id',
          operator: 'value_previous',
          value: '',
        },
      ],
      any: [],
    },
  },
  TicketSolved: {
    conditions: {
      all: [
        {
          field: 'status',
          operator: 'value',
          value: 'SOLVED',
        },
      ],
      any: [],
    },
  },
  NewMessage: {
    conditions: {
      all: [
        {
          field: 'comment_is_public',
          operator: 'is',
          value: 'requester_can_see_comment',
        },
        {
          field: 'current_via_id',
          operator: 'is_not',
          value: '5',
        },
      ],
      any: [],
    },
  },
} as const
