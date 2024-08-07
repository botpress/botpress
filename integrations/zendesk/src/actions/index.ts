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
} satisfies bp.IntegrationProps['actions']
