import { TrelloClient } from './trello-api/trello-client'
import {
  cleanupStaleWebhooks,
  registerTrelloWebhookIfNotExists,
  unregisterTrelloWebhooks,
} from './webhook-lifecycle-utils'
import * as bp from '.botpress'

export const register: bp.Integration['unregister'] = async ({ webhookUrl, ...props }) => {
  const trelloClient = new TrelloClient({ ctx: props.ctx })
  await cleanupStaleWebhooks(props, webhookUrl, trelloClient)
  await registerTrelloWebhookIfNotExists(props, webhookUrl, trelloClient)
}

export const unregister: bp.Integration['unregister'] = async ({ webhookUrl, ...props }) => {
  const trelloClient = new TrelloClient({ ctx: props.ctx })
  await unregisterTrelloWebhooks(props, webhookUrl, trelloClient)
}
