import type { RegisterFunction } from '../misc/types'
import { getClient } from '../utils'

export const register: RegisterFunction = async ({
  ctx,
  client,
  webhookUrl,
}) => {
  const ZensunClient = getClient(ctx.configuration)
  const webhookData = {
    target: webhookUrl,
    triggers: ['conversation:message'],
  }
  const zensunIntegrationId = await ZensunClient.getOrCreateIntegrationId(
    'BotpressZensun',
    webhookData
  )
  if (!zensunIntegrationId) {
    console.warn(
      'error creating the integration in Sunshine Conversations Connect'
    )
    return
  }
  await client.setState({
    type: 'integration',
    id: ctx.integrationId,
    name: `zensunIntegrationInfo`,
    payload: {
      zensunIntegrationId,
    },
  })
}
