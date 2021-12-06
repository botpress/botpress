import ReactMessageRenderer, { defaultMessageConfig } from '@botpress/messaging-components'
import classnames from 'classnames'
import React from 'react'

import { ContextMessage } from '../../../types'

import style from './style.scss'

const ChatPreview = ({ messages }: { messages: ContextMessage[] }) => (
  <div className={style.chatPreview}>
    {messages.map((message, i) => {
      // TODO: Add translation and move this logic into the @botpress/messaging-components lib
      if (message.type === 'session_reset') {
        return <div className={style.chatPreviewMessage_System}>Reset the conversation</div>
      }
      const isUserMessage = message.direction === 'incoming'
      const isBotMessage = message.direction === 'outgoing'
      const isCardMessage = message.payload.type === 'card'

      return (
        <div
          key={i}
          className={classnames(style.chatPreviewMessage, {
            [style.chatPreviewMessage_Incoming]: isUserMessage,
            [style.chatPreviewMessage_Outgoing]: isBotMessage,
            [style.chatPreviewMessage_Current]: message.isCurrent
          })}
        >
          <div className={style.chatPreviewAvatar}>{isUserMessage ? 'U' : 'B'}</div>
          <div
            className={classnames(style.chatPreviewText, {
              [style.card]: isCardMessage
            })}
          >
            <ReactMessageRenderer
              content={message.payload}
              config={{ ...defaultMessageConfig, isBotMessage, isLastGroup: false, isLastOfGroup: false }}
            />
          </div>
        </div>
      )
    })}
  </div>
)

export default ChatPreview
