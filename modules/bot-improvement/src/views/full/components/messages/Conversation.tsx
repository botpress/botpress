import { lang } from 'botpress/shared'
import { BotImprovementApi } from 'full/api'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import { FeedbackItem, FlaggedMessageGroup } from '../../../../backend/typings'
import style from '../../style.scss'

import { ConversationHeader } from './ConversationHeader'
import { MessageList } from './MessageList'

const Conversation: FC<{ api: BotImprovementApi; feedbackItem: FeedbackItem }> = props => {
  const [messageGroups, setMessageGroups] = useState<FlaggedMessageGroup[]>([])

  useEffect(() => {
    const fetchMessages = async () => {
      const messageGroups = await props.api.fetchSession(props.feedbackItem.sessionId)
      const flaggedMessageGroups = messageGroups.map(g => {
        const flagged = g.incoming.id === props.feedbackItem.eventId
        return _.merge(g, { flagged })
      })
      setMessageGroups(flaggedMessageGroups)
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchMessages()
  }, [props.feedbackItem])

  return (
    <div className={style.conversation} style={{ overflow: 'hidden' }}>
      <ConversationHeader displayName={lang.tr('module.bot-improvement.converationPreview')} />
      <MessageList messageGroups={messageGroups} />
    </div>
  )
}

export default Conversation
