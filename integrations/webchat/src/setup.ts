import { MessagingChannel } from '@botpress/messaging-client'
import { INTEGRATION_STATE_NAME, INTEGRATION_STATE_TYPE } from './const'
import { RegisterFunction, UnregisterFunction } from './misc/types'

export const register: RegisterFunction = async (props) => {
  const {
    client,
    ctx: { integrationId, configuration },
    webhookUrl,
  } = props

  const { messagingUrl, clientId, clientToken, adminKey } = configuration

  const channel = new MessagingChannel({ url: messagingUrl, adminKey })
  channel.start(clientId, { clientToken })

  const { webhooks } = await channel.sync(clientId, { webhooks: [{ url: webhookUrl }] })

  const webhook = webhooks[0]

  if (!webhook) {
    throw new Error('No webhook found')
  }

  if (!webhook.token) {
    throw new Error('No webhook token')
  }

  await client.setState({
    type: INTEGRATION_STATE_TYPE,
    id: integrationId,
    name: INTEGRATION_STATE_NAME,
    payload: { webhookToken: webhook.token, webhook: { token: webhook.token } },
  })
}

export const unregister: UnregisterFunction = async () => {
  // nothing to remove
}
