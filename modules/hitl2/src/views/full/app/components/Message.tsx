import React, { FC } from 'react'
import * as sdk from 'botpress/sdk'
import cx from 'classnames'
import style from './../../style.scss'

const Message: FC<sdk.IO.StoredEvent> = props => {
  function formattedTime(time) {
    return time.toLocaleString(navigator.language, {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={cx(style.message)}>
      <p>{props.event.preview}</p>
      <p>{formattedTime(props.createdOn)}</p>
    </div>
  )
}

export default Message
