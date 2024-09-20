import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async () => {
  // nothing to register
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {
  // nothing to unregister
}

export const createConversation: bp.IntegrationProps['createConversation'] = async ({ client, channel, tags }) => {
  await client.createConversation({ channel, tags })
}
