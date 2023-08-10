import { ConditionsData, getZendeskClient } from './client'
import type { RegisterFunction, UnregisterFunction } from './misc/types'
import { TRIGGERS, TriggerNames } from './triggers'

export const register: RegisterFunction = async ({ client, ctx, webhookUrl }) => {
  await unregister({ ctx, client, webhookUrl })

  const zendeskClient = getZendeskClient(ctx.configuration)
  const subscriptionId = await zendeskClient.subscribeWebhook(webhookUrl)

  if (!subscriptionId) {
    console.warn('error creating the webhook subscription')
    return
  }

  const triggersCreated: string[] = []

  try {
    for (const [triggerName, triggerData] of Object.entries(TRIGGERS)) {
      const triggerId = await zendeskClient.createTrigger(
        triggerName as TriggerNames,
        subscriptionId,
        triggerData.conditions as ConditionsData
      )

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
