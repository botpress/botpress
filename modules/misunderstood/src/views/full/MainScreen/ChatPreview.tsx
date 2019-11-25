import classnames from 'classnames'
import React from 'react'

import { ContextMessage } from '../../../types'

import style from './style.scss'

const ChatPreview = ({ messages }: { messages: ContextMessage[] }) => (
  <div className={style.chatPreview}>
    {messages
      .filter(message => message.preview)
      .map((message, i) => (
        <div
          key={i}
          className={classnames(style.chatPreviewMessage, {
            [style.chatPreviewMessage_Incoming]: message.direction === 'incoming',
            [style.chatPreviewMessage_Outgoing]: message.direction === 'outgoing',
            [style.chatPreviewMessage_Current]: message.isCurrent
          })}
        >
          <div className={style.chatPreviewAvatar}>{message.direction === 'incoming' ? 'U' : 'B'}</div>
          <div className={style.chatPreviewText}>{(message.preview || '').replace(/<[^>]*>?/gm, '')}</div>
        </div>
      ))}
  </div>
)

export default ChatPreview
