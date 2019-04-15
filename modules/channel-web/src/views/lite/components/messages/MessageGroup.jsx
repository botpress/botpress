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
            /**
             * @deprecated 12.0
             * Here, we convert old format to the new format Botpress uses internally.
             * - payload: all the data (raw, whatever) that is necessary to display the element
             * - type: extracted from payload for easy sorting
             */
            const payload = data.payload || data.message_data || data.message_raw || { text: data.message_text }
            if (!payload.type) {
              payload.type = data.message_type || (data.message_data && data.message_data.type) || 'text'
            }

            // Keeping compatibility with old schema for the quick reply
            if (data.message_type === 'quick_reply' && !payload.text) {
              payload.text = data.message_text
            }

            if (data.message_type === 'file' && !payload.url) {
              payload.url = (data.message_data && data.message_data.url) || (data.message_raw && data.message_raw.url)
            }

            return (
              <Message
                bp={props.bp}
                key={`msg-${i}`}
                isLastOfGroup={i >= props.messages.length - 1}
                isLastGroup={props.isLastGroup}
                payload={payload}
                sentOn={data.sent_on}
                onSendData={props.onSendData}
                onFileUpload={props.onFileUpload}
                isBotMessage={!data.userId}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default MessageGroup
