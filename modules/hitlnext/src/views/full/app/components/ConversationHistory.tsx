import { Spinner } from '@blueprintjs/core'
import { AxiosInstance } from 'axios'
import { IO } from 'botpress/sdk'
import _ from 'lodash'
import React, { FC, Fragment, useContext, useEffect, useCallback, useState } from 'react'

import { WEBSOCKET_TOPIC } from '../../../../constants'
import { IHandoff, ISocketMessage } from '../../../../types'
import { HitlClient } from '../../../client'
import { Context } from '../Store'
import MessageList from './MessageList'

interface Props {
  api: HitlClient
  bp: { axios: AxiosInstance; events: any }
  conversationId: string
}

const ConversationHistory: FC<Props> = ({ api, bp, conversationId }) => {
  const { state } = useContext(Context)

  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<IO.StoredEvent[]>([])

  const handleMessage = useCallback(
    (message: ISocketMessage) => {
      if (message.resource === 'event' && message.type === 'create') {
        if (message.payload.threadId === conversationId) {
          setEvents(evts => [...evts, message.payload])
        }
      }
    },
    [conversationId]
  )

  useEffect(() => {
    bp.events.on(`${WEBSOCKET_TOPIC}:${window.BOT_ID}`, handleMessage)
    return () => bp.events.off(`${WEBSOCKET_TOPIC}:${window.BOT_ID}`, handleMessage)
  }, [conversationId])

  useEffect(() => {
    void api.getMessages(conversationId, 'id', true, state.config.messageCount).then(evts => {
      setEvents(evts)
      setLoading(false)
    })
  }, [conversationId])

  return (
    <Fragment>
      {loading && <Spinner></Spinner>}
      {!loading && <MessageList events={events}></MessageList>}
    </Fragment>
  )
}

export default ConversationHistory
