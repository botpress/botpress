import * as sdk from 'botpress/sdk'
import cx from 'classnames'
import React, { FC } from 'react'

import style from './../../style.scss'
import { Message } from './Message'

interface Props {
  messages: sdk.IO.StoredEvent[]
}

// This does not support message groups
// Either export message group from webchat in ui-shared-lite and show it here
// Or show a "readonly webchat"
const MessageList: FC<Props> = props => {
  // TODO some smart grouping do display date
  return (
    <div className={cx(style.messageList)}>
      {props.messages.map(m => (
        <Message key={m.id} {...m} />
      ))}
    </div>
  )
}

export default MessageList
