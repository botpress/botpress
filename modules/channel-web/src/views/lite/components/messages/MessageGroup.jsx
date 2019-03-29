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
          {props.messages.map((old_data, i) => {
            /**
             * Here, we convert old format to the new format Botpress uses internally.
             * - payload: all the data (raw, whatever) that is necessary to display the element
             * - type: extracted from payload for easy sorting
             */
            const payload = old_data.message_data || old_data.message_raw || { text: old_data.message_text }
            const type = old_data.message_type || old_data.message_data.type

            return (
              <Message
                bp={props.bp}
                key={`msg-${i}`}
                isLastOfGroup={i >= props.messages.length - 1}
                isLastGroup={props.isLastGroup}
                payload={payload}
                type={type}
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
