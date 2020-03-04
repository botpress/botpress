import { Icon, Tooltip } from '@blueprintjs/core'
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
        {props.nodeType} (<small>{props.nodeName}</small>)
      </span>
      {props.isStartNode && <Icon icon="star" color="white" iconSize={15} />}
    </div>
  )
}

export const showHeaderV2: FC<HeaderProps> = props => {
  return (
    <div className={style.header}>
      <span className={style.fullSize}>{props.nodeType}</span>
      <Tooltip content={props.nodeName} position="top">
        <Icon icon="tag" iconSize={12} color="black"></Icon>
      </Tooltip>
    </div>
  )
}

export const textToItemId = text => text?.match(/^say #!(.*)$/)?.[1]
