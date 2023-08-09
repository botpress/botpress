import actions from './actions'
import { ZendeskApi } from './client'

import { executeTicketAssigned } from './events/ticket-assigned'
import { executeTicketSolved } from './events/ticket-solved'
import type { ConditionsData, Trigger, TriggerNames, TriggerPayload } from './misc/types'
import * as botpress from '.botpress'
type Config = botpress.configuration.Configuration

console.info('starting integration')

// TODO: TriggerDefinition
const TRIGGERS: Record<TriggerNames, any> = {
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
} as const

const getClient = (config: Config) => new ZendeskApi(config.baseURL, config.username, config.apiToken)

export default new botpress.Integration({
  register: async ({ ctx, client, webhookUrl }) => {
    const zendeskClient = getClient(ctx.configuration)

    // TODO: this can be called multiple times, so we need to check if the webhook is already created

    const subscriptionId = await zendeskClient.subscribeWebhook(webhookUrl)

    if (!subscriptionId) {
      console.warn('error creating the webhook subscription')
      return
    }

    const { state } = await client.getState({
      id: ctx.integrationId,
      name: 'subscriptionInfo',
      type: 'integration',
    })

    if (state.payload.subscriptionId?.length) {
      await zendeskClient.unsubscribeWebhook(state.payload.subscriptionId)
    }

    if (state.payload.triggerIds?.length) {
      console.log('deleting triggers', state.payload.triggerIds)
      for (let trigger of state.payload.triggerIds) {
        await zendeskClient.deleteTrigger(trigger)
      }
    }

    let triggersCreated: string[] = []

    try {
      for (let [triggerName, triggerData] of Object.entries(TRIGGERS)) {
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
  },
  unregister: async ({ ctx, client }) => {
    const zendeskClient = getClient(ctx.configuration)

    // TODO: refactor.. re-use the same method as above
    const { state } = await client.getState({
      id: ctx.integrationId,
      name: 'subscriptionInfo',
      type: 'integration',
    })
    console.log(state)

    if (state.payload.subscriptionId?.length) {
      await zendeskClient.unsubscribeWebhook(state.payload.subscriptionId)
    }

    if (state.payload.triggerIds?.length) {
      console.log('deleting triggers', state.payload.triggerIds)
      for (let trigger of state.payload.triggerIds) {
        await zendeskClient.deleteTrigger(trigger)
      }
    }
  },
  actions,
  channels: {
    ticket: {
      messages: {
        text: async ({ client, payload, ...props }) => {
          const zendeskClient = getClient(props.ctx.configuration)
          console.log('creating comment', payload.text)

          // if message comes from agent, we need to forward it to the original conversation
          // if message comes from user, we need to add it to the ticket

          console.log('==> user', props.user)
          console.log('==> convo', props.conversation)
          console.log('==> message', props.message)

          console.log('===> GET message', await client.getMessage({ id: props.message.id }))

          return await zendeskClient.createComment({
            ...props,
            content: payload.text,
          })
        },
      },
    },
  },
  handler: async ({ req, ctx, client }) => {
    const zendeskClient = getClient(ctx.configuration)

    if (!req.body) {
      console.warn('Handler received an empty body')
      return
    }
    const trigger = JSON.parse(req.body)

    const zendeskTrigger = trigger as TriggerPayload
    console.log('handler:', zendeskTrigger)

    switch (zendeskTrigger.type) {
      case 'NewMessage':
        const { conversation } = await client.getOrCreateConversation({
          channel: 'ticket',
          tags: {
            'zendesk1:id': zendeskTrigger.ticketId,
          },
        })

        if (!zendeskTrigger.currentUserId?.length) {
          console.log('no current user id, creating a new one')
          const { user: newUser } = await client.getOrCreateUser({
            tags: {
              'zendesk1:origin': 'zendesk',
            },
          })

          zendeskClient.updateUser()
        }

        const { user } = await client.getOrCreateUser({
          tags: {
            'zendesk1:id': zendeskTrigger.requesterId,
            'zendesk1:origin': 'zendesk',
          },
        })

        const { user: user2 } = await client.updateUser({ id: user.id, tags: { 'zendesk1:origin': 'zendesk' } })
        console.log(user2)

        const { message } = await client.createMessage({
          tags: { 'zendesk1:id': zendeskTrigger.updated_at, 'zendesk1:origin': 'zendesk' },
          type: 'text',
          userId: user.id,
          conversationId: conversation.id,
          payload: { text: zendeskTrigger.comment },
        })

        console.log(await client.updateMessage({ id: message.id, tags: { origin: 'zendesk' } }))

        return

      //return await executeMessageFromAgent({ zendeskTrigger, client });
      case 'TicketAssigned':
        return await executeTicketAssigned({ zendeskTrigger, client })
      case 'TicketSolved':
        return await executeTicketSolved({ zendeskTrigger, client })

      default:
        console.warn('unsopported trigger type')
        break
    }
  },
})
