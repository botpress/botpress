import { BotFrameworkAdapter, ConversationReference } from 'botbuilder'
import * as bp from '.botpress'

type TeamsConfig = bp.configuration.Configuration

export const getAdapter = (config: TeamsConfig) => {
  return new BotFrameworkAdapter({
    channelAuthTenant: config.tenantId,
    appId: config.appId,
    appPassword: config.appPassword,
  })
}

export const getConversationReference = async ({
  conversationId,
  client,
}: {
  conversationId: string
  client: bp.Client
}) => {
  const stateRes = await client.getState({
    id: conversationId,
    name: 'conversation',
    type: 'conversation',
  })
  const { state } = stateRes
  return state.payload as ConversationReference
}
