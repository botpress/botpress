import _ from 'lodash'
import moment from 'moment'
import React, { FC } from 'react'

import { Message as HitlMessage } from '../../../../backend/typings'

import Message from './Message'

interface Props {
  messages: HitlMessage[]
}

class MessageWrapper extends React.Component<{ message: any }> {
  state = {
    hasError: false
  }

  static getDerivedStateFromError(error) {
    console.error('There was an error while trying to display this message: ', error)
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <p className="bph-chat-error">* Cannot display message *</p>
    }

    return <Message message={this.props.message} />
  }
}

export const MessageList: FC<Props> = props => {
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
            <MessageWrapper key={`${message.id}${message.ts}`} message={message} />
          ))}
        </div>
      ))}
    </div>
  )
}
