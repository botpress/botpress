import { Button, Icon, IconName, Menu } from '@blueprintjs/core'
import { contextMenu, lang } from 'botpress/shared'
import cx from 'classnames'
import React, { FC, useState } from 'react'
import { sanitizeName } from '~/util'

import style from '../TopicList/style.scss'

import { NodeData } from '.'

interface Props {
  className?: string
  item: NodeData
  level: number
  contextMenuContent: any
  canDrag?: boolean
  isExpanded: boolean
  isEditingNew: boolean
  isEditing: boolean
  onClick: () => void
  onDoubleClick?: () => void
  onSave?: (value: string) => void
}

const TreeItem: FC<Props> = ({
  contextMenuContent,
  item,
  level,
  className,
  canDrag,
  isExpanded,
  isEditingNew,
  isEditing,
  onClick,
  onDoubleClick,
  onSave
}) => {
  const [inputValue, setInputValue] = useState(isEditingNew ? '' : item?.id)

  const onContextMenu = e => {
    e.preventDefault()

    if (contextMenuContent !== undefined) {
      contextMenu(e, <Menu className={style.contextMenu}>{contextMenuContent}</Menu>)
    }
  }

  const sanitize = (name: string) => {
    return sanitizeName(name).replace(/\//g, '-')
  }

  const onKeyDown = event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      event.target.select()
    }

    if (event.key === 'Escape' || event.key === 'Enter') {
      event.target.blur()
    }
  }

  const hasChildren = !!item.children?.length || level === 0
  const chevron = !isExpanded ? 'chevron-right' : 'chevron-down'

  let placeholder = lang.tr('studio.flow.sidePanel.renameWorkflow')

  if (isEditingNew) {
    placeholder = lang.tr('studio.flow.sidePanel.nameWorkflow')
  }

  if (isEditing) {
    return (
      <div style={{ paddingLeft: `${level * 23}px` }} className={cx(className, style.inlineEditing)}>
        <input
          type="text"
          autoFocus
          onFocus={e => e.currentTarget.select()}
          onBlur={() => onSave(inputValue || item.id)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          onChange={e => setInputValue(sanitize(e.currentTarget.value))}
        />
      </div>
    )
  }

  return (
    <Button
      style={{ paddingLeft: `${level * 23}px` }}
      minimal
      className={className}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
      onClick={onClick}
      icon={
        canDrag && item.type === 'workflow' ? (
          <span
            className={style.draggable}
            draggable
            onDragStart={event => {
              event.dataTransfer.setData('diagram-node', JSON.stringify({ type: 'subworkflow', id: item.id }))
            }}
          >
            <Icon icon={hasChildren ? chevron : (item.icon as IconName)} />
          </span>
        ) : (
          <Icon icon={hasChildren ? chevron : (item.icon as IconName)} />
        )
      }
    >
      <span className={style.topicName}>
        <span className={style.ellipsisText}>{item.label || item.id}</span>
      </span>
    </Button>
  )
}

export default TreeItem
