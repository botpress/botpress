import { Spinner } from '@blueprintjs/core'
import { EmptyState, lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useState } from 'react'

import { SocketMessageType } from '../../../../types'
import { ApiType, castMessage } from '../../Api'

import MessageList from './MessageList'

interface Props {
  bp: any
  api: ApiType
  conversationId: string
}

const ConversationHistory: FC<Props> = props => {
  // Number of messages to display
  const MESSAGE_COUNT = 10

  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState([])

  function handleMessage(message: SocketMessageType) {
    if (message.resource == 'event' && message.type == 'create') {
      setMessages(messages =>
        _.sortBy([...messages, castMessage(message.payload)], 'createdOn').slice(MESSAGE_COUNT * -1)
      )
    }
  }

  async function getMessages() {
    setMessages(
      _.sortBy(await props.api.getMessages(props.conversationId, 'createdOn', true, MESSAGE_COUNT), 'createdOn')
    )
  }

  useEffect(() => {
    props.bp.events.on('hitl2', handleMessage.bind(this))
    return () => props.bp.events.off('hitl2', handleMessage)
  }, [])

  useEffect(() => {
    // tslint:disable-next-line: no-floating-promises
    getMessages().then(() => setLoading(false))
  }, [props.conversationId])
  return (
    <Fragment>
      {loading && <Spinner></Spinner>}
      {!loading && !messages.length && <EmptyState text="NO MESSAGES"></EmptyState>}

      {!!messages.length && <MessageList messages={messages}></MessageList>}
    </Fragment>
  )
}

export default ConversationHistory
