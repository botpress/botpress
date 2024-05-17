import { getLinearClient } from './misc/utils'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ client, ctx }) => {
  try {
    const linearClient = await getLinearClient(client, ctx.integrationId)
    const user = await linearClient.userSettings.then((settings) => settings.user)
    await client.setState({
      type: 'integration',
      name: 'configuration',
      id: ctx.integrationId,
      payload: { botUserId: user?.id },
    })
  } catch {
    // when using non-oauth integrations, we don't need to get the botUserId
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {
  // nothing to unregister
}

export const createConversation: bp.IntegrationProps['createConversation'] = async ({ client, channel, tags }) => {
  await client.createConversation({ channel, tags })
}
