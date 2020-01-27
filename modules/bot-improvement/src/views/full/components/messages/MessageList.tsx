import _ from 'lodash'
import moment from 'moment'
import React, { FC } from 'react'

import { MessageGroup } from '../../../../backend/typings'

import Message from './Message'

export const MessageList: FC<{ messageGroups: MessageGroup[] }> = props => {
  return (
    <div>
      {props.messageGroups.map((group, groupIdx) => (
        <div key={groupIdx}>
          <Message message={group.incoming} />
          {group.replies.map((message, messageIdx) => (
            <Message key={`${groupIdx}${messageIdx}`} message={message} />
          ))}
        </div>
      ))}
    </div>
  )
}
