import * as sdk from '@botpress/sdk'
import axios from 'axios'
import * as bp from '.botpress'

import { generateLink } from './actions/generateLink'
import { getEventTypes } from './actions/getEventTypes'
import { getAvailableTimeSlots } from './actions/getAvailableTimeSlots'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    generateLink,
    getEventTypes,
    getAvailableTimeSlots,
  },
  channels: {},
  handler: async (props: bp.HandlerProps) => {
    const {
      client,
      req: { body },
    } = props

    props.logger.forBot().debug('calcom::handler', body)
    let conversationId
    try {
      if (body) {
        const response = JSON.parse(body)

        props.logger
          .forBot()
          .info('calcom::handler with convos', response.payload?.attendees[0], await client.listConversations({}))

        for (const attendee of response.payload?.attendees || []) {
          props.logger.forBot().debug('calcom::handler attendee', attendee)
          const conversations = await client.listConversations({ tags: { email: attendee.email } })

          props.logger
            .forBot()
            .debug('calcom::handler conversations', conversations, await client.listConversations({}))

          if (conversations.conversations.length > 0) {
            conversationId = conversations.conversations[0]?.id
            break
          }
        }
      }
    } catch (e) {
      props.logger.error(e)
    }

    props.logger.forBot().debug('calcom::handler conversationId', conversationId)

    await client.createEvent({
      type: 'eventScheduled',
      //conversationId: conversationId || undefined,
      payload: {
        event: 'aa',
        conversationId: conversationId || '',
      },
    })
  },
})
