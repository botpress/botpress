import { Icon } from '@blueprintjs/core'
import { FC } from 'react'
import React from 'react'

import style from './style.scss'

interface Props {
  message: string | React.ReactElement
}

const InfoMessage: FC<Props> = ({ message }) => {
  return (
    <div className={style.info_container}>
      <div className={style.info}>
        <Icon icon="info-sign" iconSize={20} className={style.info_icon} />
        <div className={style.info_text}>{message}</div>
      </div>
    </div>
  )
}

export default InfoMessage
