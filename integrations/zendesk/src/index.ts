import actions from './actions'
import { ZendeskApi } from './client'

import { executeTicketAssigned } from './events/ticket-assigned'
import { executeTicketSolved } from './events/ticket-solved'
import type { ConditionsData, TriggerNames, TriggerPayload } from './misc/types'
import * as botpress from '.botpress'

type Config = botpress.configuration.Configuration

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

    const triggersCreated: string[] = []

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
        text: async ({ ...props }) => {
          // console.log(JSON.stringify(props, null, 2), payload)
          const zendeskClient = getClient(props.ctx.configuration)
          // console.log('creating comment', payload.text)

          // if message comes from agent, we need to forward it to the original conversation
          // if message comes from user, we need to add it to the ticket
          // console.log('===> User received', props.user)
          // console.log('===> GET User', await client.getUser({ id: props.message.userId }))

          const { user } = await props.client.getUser({ id: props.payload.userId })

          if (user.tags?.origin === 'zendesk') {
            console.log('===> Message from Bot')
            return
          }

          const ticketId = props.conversation!.tags['zendesk1:id']!
          const zendeskUserId = user.tags['zendesk1:id']!
          console.log({ ticketId, zendeskUserId })
          return await zendeskClient.createComment(ticketId, zendeskUserId, props.payload.text)
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
            id: zendeskTrigger.ticketId,
          },
        })

        if (!zendeskTrigger.currentUser.external_id?.length) {
          console.log('no current user id, creating a new one')
          const { user: newUser } = await client.getOrCreateUser({
            tags: {
              id: zendeskTrigger.currentUser.id,
              origin: 'zendesk',
              name: zendeskTrigger.currentUser.name,
              email: zendeskTrigger.currentUser.email,
              role: zendeskTrigger.currentUser.role,
            },
          })

          console.log('New User', newUser)
          await zendeskClient.updateUser(zendeskTrigger.currentUser.id, {
            external_id: newUser.id,
          })
        }

        const { user } = await client.getOrCreateUser({
          tags: {
            id: zendeskTrigger.currentUser.id,
          },
        })

        console.log('After User', user)

        console.log(
          await client.createMessage({
            tags: { origin: 'zendesk' },
            type: 'text',
            userId: user.id,
            conversationId: conversation.id,
            payload: { text: zendeskTrigger.comment, userId: zendeskTrigger.currentUser.external_id },
          })
        )

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
