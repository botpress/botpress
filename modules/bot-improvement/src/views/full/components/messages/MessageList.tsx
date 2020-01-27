import _ from 'lodash'
import React, { FC } from 'react'

import { MessageGroup } from '../../../../backend/typings'
import style from '../../style.scss'

import Message from './Message'

export const MessageList: FC<{ messageGroups: MessageGroup[] }> = props => {
  return (
    <div>
      {props.messageGroups.map((group, groupIdx) => (
        <div key={groupIdx} className={group.flagged && style['messageGroup-flagged']}>
          <Message message={group.incoming} />
          {group.replies.map((message, messageIdx) => (
            <Message key={`${groupIdx}${messageIdx}`} message={message} />
          ))}
        </div>
      ))}
    </div>
  )
}
