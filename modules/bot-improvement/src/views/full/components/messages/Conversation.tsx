import { BotImprovementApi } from 'full/api'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import { FeedbackItem, MessageGroup } from '../../../../backend/typings'

import { ConversationHeader } from './ConversationHeader'
import { MessageList } from './MessageList'

const Conversation: FC<{ api: BotImprovementApi; feedbackItem: FeedbackItem }> = props => {
  const [messageGroups, setMessageGroups] = useState<MessageGroup[]>([])

  useEffect(() => {
    const fetchMessages = async () => {
      const messageGroups = await props.api.fetchSession(props.feedbackItem.sessionId)
      setMessageGroups(messageGroups)
    }
    fetchMessages().catch(e => {
      throw e
    })
  }, [props.feedbackItem])

  const { user } = props.feedbackItem
  const displayName = _.get(user, 'attributes.full_name', user.fullName)

  return (
    <div className="bph-conversation" style={{ overflow: 'hidden' }}>
      <ConversationHeader displayName={displayName} />

      {/* <div className="bph-conversation-messages" ref={m => (this.messagesDiv = m)}> */}
      <div className="bph-conversation-messages">
        <MessageList messageGroups={messageGroups} />
      </div>
    </div>
  )
}

export default Conversation
