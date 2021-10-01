import React, { ReactElement } from 'react'
import ReactDOM from 'react-dom'
import { Message, MessageConfig, MessageType } from 'typings'
import { isSupportedMessageType, FallthroughIntl } from 'utils'
import { Carousel, File, Text } from './renderer'

export const defaultMessageConfig: MessageConfig = {
  escapeHTML: true,
  isInEmulator: false,
  onSendData: async () => {
    return
  },
  onFileUpload: async (label, payload, file) => {
    return
  },
  onMessageClicked: messageId => {
    return
  },
  noMessageBubble: false,
  intl: new FallthroughIntl(),
  showTimestamp: false,
  bp: window.botpress
}

export function renderMessage(message: Message<MessageType>): ReactElement | null {
  const { type } = message

  switch (type) {
    case 'text':
      return <Text {...(message as Message<'text'>)} />
    case 'audio':
      return <File {...(message as Message<'file'>)} />
    case 'video':
      return <File {...(message as Message<'file'>)} />
    case 'file':
      return <File {...(message as Message<'file'>)} />
    // case 'dropdown':
    //   return <Dropdown {...payload} {...config} />
    // case 'visit':
    //   return null
    // case 'voice':
    //   return <VoiceMessage {...payload} {...config} />
    // case 'typing':
    //   return null
    case 'carousel':
      return <Carousel {...(message as Message<'carousel'>)} />
    // case 'login_prompt':
    //   return <LoginPrompt {...payload} {...config} />
    // case 'quick_reply':
    //   return <QuickReplies {...payload} {...config} />
    // case 'session_reset':
    //   return null
    // case 'custom':
    //   return null
    default:
      return <>* Unsupported message type *</>
  }
}
