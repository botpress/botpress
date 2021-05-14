import * as sdk from 'botpress/sdk'
import cx from 'classnames'
import sortby from 'lodash/sortBy'
import React, { FC } from 'react'

import style from '../../style.scss'
import { Message } from './Message'

interface Props {
  events: sdk.IO.StoredEvent[]
}

// This does not support message groups
const MessageList: FC<Props> = props => {
  return (
    <div className={cx(style.messageList)}>
      {sortby(props.events, 'id').map(ev => (
        <Message key={ev.id} {...ev} />
      ))}
    </div>
  )
}

export default MessageList
