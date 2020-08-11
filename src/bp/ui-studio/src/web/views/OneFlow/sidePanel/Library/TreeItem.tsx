import { Button, IconName, Menu } from '@blueprintjs/core'
import { contextMenu } from 'botpress/shared'
import React, { FC } from 'react'

import style from '../TopicList/style.scss'

import { NodeData } from '.'

interface Props {
  className?: string
  item: NodeData
  level: number
  contextMenuContent: any
  isExpanded: boolean
  onClick: () => void
  onDoubleClick?: () => void
}

const TreeItem: FC<Props> = ({ contextMenuContent, item, level, className, isExpanded, onClick, onDoubleClick }) => {
  const onContextMenu = e => {
    e.preventDefault()

    if (contextMenuContent !== undefined) {
      contextMenu(e, <Menu className={style.contextMenu}>{contextMenuContent}</Menu>)
    }
  }

  const hasChildren = !!item.children?.length || level === 0
  const chevron = !isExpanded ? 'chevron-right' : 'chevron-down'

  return (
    <Button
      style={{ paddingLeft: `${level * 23}px` }}
      minimal
      className={className}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
      onClick={onClick}
      icon={hasChildren ? chevron : (item.icon as IconName)}
    >
      <span className={style.topicName}>{item.label || item.id}</span>
    </Button>
  )
}

export default TreeItem
