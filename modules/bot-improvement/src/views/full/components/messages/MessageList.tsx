import { contentPayloads } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, useEffect } from 'react'

import { FlaggedMessageGroup } from '../../../../backend/typings'
import style from '../../style.scss'

import Message from './Message'

export const MessageList: FC<{ messageGroups: FlaggedMessageGroup[] }> = props => {
  const { messageGroups } = props
  const itemRefs = {}

  useEffect(() => {
    if (_.isEmpty(messageGroups)) {
      return
    }
    const flaggedMessageGroup = messageGroups.find(g => g.flagged)
    const ref = itemRefs[flaggedMessageGroup.incoming.id]
    messagesListRef.current.scrollTop =
      ref.offsetTop - screen.height / 2 + ref.offsetHeight / 2 + messagesListRef.current.offsetTop
  })

  const messagesListRef = React.createRef<HTMLDivElement>()

  return (
    <div ref={messagesListRef} className={style.conversationMessages}>
      {messageGroups.map(group => (
        <div
          ref={el => (itemRefs[group.incoming.id] = el)}
          key={group.incoming.id}
          className={`${style.messageGroup} ` + (group.flagged && style.flagged)}
        >
          <Message
            message={{ ...group.incoming, raw_message: contentPayloads.renderPayload(group.incoming.raw_message) }}
          />
          {group.replies.map(message => (
            <Message
              key={`${group.incoming.id}-${message.id}`}
              message={{ ...message, raw_message: contentPayloads.renderPayload(message.raw_message) }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
