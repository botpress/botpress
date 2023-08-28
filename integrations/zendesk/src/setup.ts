import { IntegrationProps } from '../.botpress/implementation'
import { getZendeskClient } from './client'
import { Triggers } from './triggers'

export const register: IntegrationProps['register'] = async ({ client, ctx, webhookUrl, logger }) => {
  try {
    await unregister({ ctx, client, webhookUrl, logger })
  } catch (err) {
    // silent catch since if it's the first time, there's nothing to unregister
  }

  const zendeskClient = getZendeskClient(ctx.configuration)
  const subscriptionId = await zendeskClient.subscribeWebhook(webhookUrl)

  if (!subscriptionId) {
    logger.forBot().error('Could not create webhook subscription')
    return
  }

  const user = await zendeskClient.createOrUpdateUser({
    role: 'end-user',
    external_id: ctx.botUserId,
    name: 'Botpress',
  })

  await client.updateUser({
    id: ctx.botUserId,
    tags: {
      'zendesk:id': `${user.id}`,
    },
  })

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

export const unregister: IntegrationProps['unregister'] = async ({ ctx, client }) => {
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
