import { Button, Icon, Intent, Tooltip } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import React, { FC, SyntheticEvent, useEffect, useState } from 'react'

import { NodeDebugInfo } from '../../debugger'

import style from './style.scss'
import { DebugInfo } from './DebugInfo'

interface Props {
  defaultLabel: string
  handleContextMenu?: (e: SyntheticEvent) => void
  children?: any
  className?: string
  debugInfo: NodeDebugInfo
  nodeType: string
}

const NodeHeader: FC<Props> = ({ defaultLabel, handleContextMenu, debugInfo, children, nodeType, className }) => {
  return (
    <div className={cx(style.headerWrapper, className)}>
      {debugInfo && <DebugInfo {...debugInfo} nodeType={nodeType} className={className}></DebugInfo>}
      <div className={style.button} onContextMenu={e => handleContextMenu && handleContextMenu(e)}>
        {defaultLabel}
      </div>
      {children}
    </div>
  )
}

export default NodeHeader
