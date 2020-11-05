import { Spinner } from '@blueprintjs/core'
import { EmptyState, lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useState } from 'react'

import { ApiType } from '../../Api'

import MessageList from './MessageList'

interface Props {
  api: ApiType
  conversationId: string
}

const ConversationHistory: FC<Props> = props => {
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState([])

  async function getMessages() {
    setMessages(await props.api.getMessages(props.conversationId, 10))
  }

  useEffect(() => {
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
