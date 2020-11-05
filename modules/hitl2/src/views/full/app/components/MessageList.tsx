import * as sdk from 'botpress/sdk'
import cx from 'classnames'
import React, { FC } from 'react'

import style from './../../style.scss'
import Message from './Message'

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
