import { getZendeskClient } from './client'
import { Triggers } from './triggers'
import type { RegisterFunction, UnregisterFunction } from './types'

export const register: RegisterFunction = async ({ client, ctx, webhookUrl, logger }) => {
  await unregister({ ctx, client, webhookUrl, logger })

  const zendeskClient = getZendeskClient(ctx.configuration)
  const subscriptionId = await zendeskClient.subscribeWebhook(webhookUrl)

  if (!subscriptionId) {
    logger.forBot().error('Could not create webhook subscription')
    return
  }

  const triggersCreated: string[] = []

  try {
    for (const trigger of Triggers) {
      const triggerId = await zendeskClient.createTrigger(trigger.name, subscriptionId, trigger.conditions)
      triggersCreated.push(triggerId)
    }
  } finally {
    await client.setState({
      type: 'integration',
      id: ctx.integrationId,
      name: 'subscriptionInfo',
      payload: {
        subscriptionId,
        triggerIds: triggersCreated,
      },
    })
  }
}

export const unregister: UnregisterFunction = async ({ ctx, client }) => {
  const zendeskClient = getZendeskClient(ctx.configuration)

  const { state } = await client.getState({
    id: ctx.integrationId,
    name: 'subscriptionInfo',
    type: 'integration',
  })

  if (state.payload.subscriptionId?.length) {
    await zendeskClient.unsubscribeWebhook(state.payload.subscriptionId)
  }

  if (state.payload.triggerIds?.length) {
    for (const trigger of state.payload.triggerIds) {
      await zendeskClient.deleteTrigger(trigger)
    }
  }
}
