import type { TriggerNames } from './misc/types'

// TODO: TriggerDefinition
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
