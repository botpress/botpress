import * as botpress from '.botpress'
import actions from './actions'
import { ZendeskApi } from './client'
import { executeMessageFromAgent } from './events/message-from-agent'
import { executeTicketAssigned } from './events/ticket-assigned'
import { executeTicketSolved } from './events/ticket-solved'
import type { ConditionsData, TriggerPayload } from './misc/types'
type Config = botpress.configuration.Configuration

console.info('starting integration')

const TRIGGERS = {
  TicketAssigned: {
    conditions: {
      all: [
        {
          field: 'assignee_id',
          operator: 'value_previous',
          value: '',
        },
      ],
      any: [],
    },
  },
  TicketSolved: {
    conditions: {
      all: [
        {
          field: 'status',
          operator: 'value',
          value: 'SOLVED',
        },
      ],
      any: [],
    },
  },
  NewMessage: {
    conditions: {
      all: [
        {
          field: 'comment_is_public',
          operator: 'is',
          value: 'requester_can_see_comment',
        },
        {
          field: 'current_via_id',
          operator: 'is_not',
          value: '5',
        },
      ],
      any: [],
    },
  },
}

const getClient = (config: Config) => new ZendeskApi(config.baseURL, config.username, config.apiToken)

export default new botpress.Integration({
  register: async ({ ctx, client, webhookUrl }) => {
    const zendeskClient = getClient(ctx.configuration)

    const subscriptionId = await zendeskClient.subscribeWebhook(webhookUrl)

    if (!subscriptionId) {
      console.warn('error creating the webhook subscription')
      return
    }

    await client.setState({
      type: 'integration',
      id: ctx.integrationId,
      name: `subscriptionInfo`,
      payload: {
        subscriptionId,
      },
    })

    for (let [triggerName, triggerData] of Object.entries(TRIGGERS)) {
      const triggerId = await zendeskClient.createTrigger(
        triggerName,
        subscriptionId,
        triggerData.conditions as ConditionsData
      )

      await client.setState({
        type: 'integration',
        id: ctx.integrationId,
        name: `trigger${triggerName}`,
        payload: {
          triggerId,
        },
      })
    }
  },
  unregister: async ({ ctx, client }) => {
    const zendeskClient = getClient(ctx.configuration)

    for (let triggerName of Object.keys(TRIGGERS)) {
      const stateRes = await client.getState({
        id: ctx.integrationId,
        name: `trigger${triggerName}`,
        type: 'integration',
      })

      const { state } = stateRes
      const { triggerId } = state.payload

      if (triggerId) {
        await zendeskClient.deleteTrigger(triggerId)
      }
    }

    const stateSubscriptionInfo = await client.getState({
      id: ctx.integrationId,
      name: `subscriptionInfo`,
      type: 'integration',
    })

    const { state } = stateSubscriptionInfo
    const { subscriptionId } = state.payload

    if (subscriptionId) {
      await zendeskClient.unsubscribeWebhook(subscriptionId)
    }
  },
  actions,
  channels: {
    ticket: {
      messages: {
        text: async ({ payload, ...props }) => {
          const zendeskClient = getClient(props.ctx.configuration)
          return await zendeskClient.createComment({
            ...props,
            content: payload.text,
          })
        },
      },
    },
  },
  handler: async ({ req, client }) => {
    if (!req.body) {
      console.warn('Handler received an empty body')
      return
    }
    const trigger = JSON.parse(req.body)

    const zendeskTrigger = trigger as TriggerPayload

    switch (zendeskTrigger.type) {
      case 'newMessage':
        const { conversation } = await client.getOrCreateConversation({
          channel: 'channel',
          tags: {
            'zendesk:id': zendeskTrigger.ticketId,
            'zendesk:authorId': zendeskTrigger.authorId,
          },
        })

        const { user } = await client.getOrCreateUser({
          tags: {
            'zendesk:id': zendeskTrigger.authorId,
          },
        })

        await client.createMessage({
          tags: { 'zendesk:id': zendeskTrigger.updated_at },
          type: 'text',
          userId: user.id,
          conversationId: conversation.id,
          payload: { text: zendeskTrigger.comment },
        })

        return

      //return await executeMessageFromAgent({ zendeskTrigger, client });
      case 'ticketAssigned':
        return await executeTicketAssigned({ zendeskTrigger, client })
      case 'ticketSolved':
        return await executeTicketSolved({ zendeskTrigger, client })

      default:
        console.warn('unsopported trigger type')
        break
    }
  },
})
