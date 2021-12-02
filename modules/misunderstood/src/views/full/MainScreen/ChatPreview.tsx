import ReactMessageRenderer, { defaultMessageConfig } from '@botpress/messaging-components'
import classnames from 'classnames'
import React from 'react'

import { ContextMessage } from '../../../types'

import style from './style.scss'

// TODO: Fix this either when we create the event or in the components lib
const fixPayload = (payload: any): ContextMessage['payload'] => {
  // Channel-web sends single-choice events and messaging replies with quick_reply
  // We convert them into text elements since we only want to display the text value
  if (payload.type === 'single-choice' || payload.type === 'quick_reply') {
    payload = { ...payload, type: 'text' }
  }

  return payload
}

const ChatPreview = ({ messages }: { messages: ContextMessage[] }) => (
  <div className={style.chatPreview}>
    {messages.map((message, i) => (
      <div
        key={i}
        className={classnames(style.chatPreviewMessage, {
          [style.chatPreviewMessage_Incoming]: message.direction === 'incoming',
          [style.chatPreviewMessage_Outgoing]: message.direction === 'outgoing',
          [style.chatPreviewMessage_Current]: message.isCurrent
        })}
      >
        <div className={style.chatPreviewAvatar}>{message.direction === 'incoming' ? 'U' : 'B'}</div>
        <div className={style.chatPreviewText}>
          <ReactMessageRenderer content={fixPayload(message.payload)} config={defaultMessageConfig} />
        </div>
      </div>
    ))}
  </div>
)

export default ChatPreview
