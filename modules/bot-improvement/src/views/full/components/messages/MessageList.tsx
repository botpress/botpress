import _ from 'lodash'
import moment from 'moment'
import React, { FC, useState } from 'react'

import { Message as HitlMessage } from '../../../../backend/typings'

import Message from './Message'

export const MessageList: FC<{ messages: HitlMessage[] }> = props => {
  if (!props.messages) {
    return <div>No Messages found</div>
  }

  const groupedMessages = _.groupBy(props.messages, msg => moment(msg.ts).format('YYYY-MM-DD'))
  const groups = Object.keys(groupedMessages).map(x => groupedMessages[x])

  if (!groups) {
    return null
  }

  return (
    <div>
      {groups.map(group => (
        <div key={group[0].id}>
          <div className="bph-conversation-date">
            <span>{moment(group[0].ts).format('DD MMMM YYYY')}</span>
          </div>
          {group.map(message => (
            <Message key={`${message.id}${message.ts}`} message={message} />
          ))}
        </div>
      ))}
    </div>
  )
}
