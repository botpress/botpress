import { IO } from 'botpress/sdk'
import cx from 'classnames'
import React, { FC } from 'react'

import style from './style.scss'

// This does not suppport funky content types nor custom components
// Either export message from webchat in ui-shared lite and show it here
// Or show a "readonly webchat"
export const Message: FC<IO.StoredEvent> = props => (
  <div className={cx(style.messageContainer, props.direction === 'incoming' ? style.user : style.bot)}>
    <div className={cx(style.message)}>
      <span>{props.event.preview}</span>
    </div>
  </div>
)
