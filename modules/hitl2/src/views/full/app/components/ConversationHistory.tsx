import { Spinner } from '@blueprintjs/core'
import { EmptyState } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, Fragment, useContext, useEffect, useState } from 'react'

import { ISocketMessage } from '../../../../types'
import { ApiType, castMessage } from '../../Api'
import { Context } from '../Store'

import MessageList from './MessageList'

interface Props {
  bp: any
  api: ApiType
  conversationId: string
}

const ConversationHistory: FC<Props> = props => {
  const { state } = useContext(Context)

  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState([])

  function handleMessage(message: ISocketMessage) {
    if (message.resource === 'event' && message.type === 'create') {
      setMessages(messages =>
        _.sortBy([...messages, castMessage(message.payload)], 'id').slice(state.config.messageCount * -1)
      )
    }
  }

  async function getMessages() {
    // Event IDs are ordered
    setMessages(
      _.sortBy(await props.api.getMessages(props.conversationId, 'id', true, state.config.messageCount), 'id')
    )
  }

  useEffect(() => {
    props.bp.events.on(`hitl2:${window.BOT_ID}`, handleMessage.bind(this))
    return () => props.bp.events.off(`hitl2:${window.BOT_ID}`, handleMessage)
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
