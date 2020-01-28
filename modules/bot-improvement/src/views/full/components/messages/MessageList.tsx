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
    ref.scrollIntoView()
  })

  return (
    <div>
      {messageGroups.map((group, groupIdx) => (
        <div
          ref={el => (itemRefs[group.incoming.id] = el)}
          key={groupIdx}
          className={(group.flagged && style['messageGroup-flagged']) || ''}
        >
          <Message message={group.incoming} />
          {group.replies.map((message, messageIdx) => (
            <Message key={`${groupIdx}${messageIdx}`} message={message} />
          ))}
        </div>
      ))}
    </div>
  )
}
