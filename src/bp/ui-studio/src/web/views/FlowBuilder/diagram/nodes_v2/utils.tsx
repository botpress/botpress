import { Icon } from '@blueprintjs/core'
import _ from 'lodash'
import React, { FC } from 'react'

import style from './style.scss'

interface HeaderProps {
  nodeType: string
  nodeName: string
  isStartNode: boolean
}

export const showHeader: FC<HeaderProps> = props => {
  return (
    <div className={style.header}>
      <span>
        {props.nodeType} · {props.nodeName}
      </span>
      {props.isStartNode && <Icon icon="star" color="#DAA520" iconSize={11} />}
    </div>
  )
}

export const textToItemId = text => _.get(text.match(/^say #!(.*)$/), '[1]')
