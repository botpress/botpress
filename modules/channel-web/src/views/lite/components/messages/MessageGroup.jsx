import React from 'react'
import classnames from 'classnames'

import Message from './Message'

const MessageGroup = props => {
  return (
    <div
      className={classnames('bpw-message-big-container', {
        'bpw-from-user': !props.isBot,
        'bpw-from-bot': props.isBot
      })}
    >
      {props.avatar}
      <div className={'bpw-message-container'}>
        {props.showUserName && <div className={'bpw-message-username'}>{props.userName}</div>}
        <div className={'bpw-message-group'}>
          {props.messages.map((data, i) => {
            return (
              <Message
                bp={props.bp}
                key={`msg-${i}`}
                isLastOfGroup={i >= props.messages.length - 1}
                isLastGroup={props.isLastGroup}
                data={data}
                onSendData={props.onSendData}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default MessageGroup
