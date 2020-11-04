import * as sdk from 'botpress/sdk'

import React, { FC } from 'react'

import Message from './Message'
import cx from 'classnames'
import style from './../../style.scss'

interface Props {
  messages: sdk.IO.StoredEvent[]
}

const MessageList: FC<Props> = props => {
  return (
    <div className={cx(style.messageList)}>
      {props.messages.map(message => (
        <Message key={message.id} {...message}></Message>
      ))}
    </div>
  )
}

export default MessageList
