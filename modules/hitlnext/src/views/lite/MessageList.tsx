import * as sdk from 'botpress/sdk'
import cx from 'classnames'
import sortby from 'lodash/sortBy'
import React, { FC } from 'react'

import { Message } from './Message'
import style from './style.scss'

interface Props {
  events: sdk.IO.StoredEvent[]
}

// This does not support message groups
// Either export message group from webchat in ui-shared-lite and show it here
// Or show a "readonly webchat"
const MessageList: FC<Props> = props => {
  // TODO some smart grouping do display date
  return (
    <div className={cx(style.messageList)}>
      {sortby(props.events, 'id').map(ev => (
        <Message key={ev.id} {...ev} />
      ))}
    </div>
  )
}

export default MessageList
