import { Spinner } from '@blueprintjs/core'
import { IO } from 'botpress/sdk'
import { EmptyState } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, Fragment, useContext, useEffect, useState } from 'react'

import { WEBSOCKET_TOPIC } from '../../../../constants'
import { ISocketMessage } from '../../../../types'
import MessageList from '../../../lite/MessageList'
import { ApiType } from '../../Api'
import { Context } from '../Store'

interface Props {
  bp: any
  api: ApiType
  conversationId: string
}

const ConversationHistory: FC<Props> = props => {
  const { state } = useContext(Context)

  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<IO.StoredEvent[]>([])

  const handleMessage = (message: ISocketMessage) => {
    if (message.resource === 'event' && message.type === 'create') {
      setEvents(evts => [...evts, message.payload])
    }
  }

  useEffect(() => {
    props.bp.events.on(`${WEBSOCKET_TOPIC}:${window.BOT_ID}`, handleMessage.bind(this))
    return () => props.bp.events.off(`${WEBSOCKET_TOPIC}:${window.BOT_ID}`, handleMessage)
  }, [])

  useEffect(() => {
    props.api.getMessages(props.conversationId, 'id', true, state.config.messageCount).then(evts => {
      setEvents(evts)
      setLoading(false)
    })
  }, [props.conversationId])

  return (
    <Fragment>
      {loading && <Spinner></Spinner>}
      {!loading && _.isEmpty(events) && <EmptyState text="NO MESSAGES"></EmptyState>}
      {!loading && !_.isEmpty(events) && <MessageList events={events}></MessageList>}
    </Fragment>
  )
}

export default ConversationHistory
