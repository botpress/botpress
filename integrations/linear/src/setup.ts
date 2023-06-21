import { CreateConversationFunction, RegisterFunction, UnregisterFunction } from './misc/types'
import { getLinearClient } from './misc/utils'

export const register: RegisterFunction = async ({ ctx, client }) => {
  const linearClient = await getLinearClient(client, ctx.integrationId)
  const user = await linearClient.userSettings.then((settings) => settings.user)

  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: { botUserId: user?.id },
  })
}

export const unregister: UnregisterFunction = async () => {
  // nothing to unregister
}

export const createConversation: CreateConversationFunction = async ({ client, channel, tags }) => {
  await client.createConversation({
    channel,
    tags,
  })
}
