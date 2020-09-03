import { Icon } from '@blueprintjs/core'
import { FC } from 'react'
import React from 'react'

import style from './style.scss'

const WarningMessage: FC<{ message: string }> = ({ message }) => {
  return (
    <div className={style.warning_container}>
      <div className={style.warning}>
        <Icon icon="warning-sign" iconSize={20} className={style.warning_icon} />
        <div className={style.warning_text}>{message}</div>
      </div>
    </div>
  )
}

export default WarningMessage
