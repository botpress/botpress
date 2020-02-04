import _ from 'lodash'
import React, { FC } from 'react'

import style from '../../style.scss'
interface Props {
  displayName: string
}

export const ConversationHeader: FC<Props> = props => {
  return (
    <div className={style.conversationHeader}>
      <div className={style.summary}>
        <span>{props.displayName}</span>
      </div>
    </div>
  )
}
