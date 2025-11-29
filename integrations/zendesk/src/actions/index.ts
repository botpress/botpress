import { callApi } from './call-api'
import { closeTicket } from './close-ticket'
import { createTicket } from './create-ticket'
import { createUser } from './create-user'
import { findCustomer } from './find-customer'
import { getTicket } from './get-ticket'
import { startHitl, stopHitl } from './hitl'
import { listAgents } from './list-agents'
import { syncKb } from './sync-kb'
import * as bp from '.botpress'

export default {
  getTicket,
  findCustomer,
  createTicket,
  createUser,
  closeTicket,
  listAgents,
  callApi,
  startHitl,
  stopHitl,
  syncKb,
  startMessagingHitl: async () => {
    console.info('Messaging HITL is not supported in the Zendesk integration yet.')
    return { conversationId: '1234' }
  },
  stopMessagingHitl: async () => {
    console.info('Messaging HITL is not supported in the Zendesk integration yet.')
    return {}
  },
} satisfies bp.IntegrationProps['actions']
