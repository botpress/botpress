import { Button, ContextMenu, Icon, Menu } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import React, { FC, useEffect, useState } from 'react'
import { sanitizeName } from '~/util'

import { CountByTopic } from './index'
import style from './style.scss'

interface Props {
  className?: string
  item: any
  onClick: () => void
  onDoubleClick?: () => void
  onSave?: (value: string) => void
  level: number
  contextMenuContent: any
  isExpanded: boolean
  isEditingNew?: boolean
  isEditing?: boolean
  qnaCount?: CountByTopic | number
}

const TreeItem: FC<Props> = ({
  contextMenuContent,
  item,
  isEditing,
  isEditingNew,
  onClick,
  onDoubleClick,
  level,
  className,
  isExpanded,
  qnaCount,
  onSave
}) => {
  const [inputValue, setInputValue] = useState(isEditingNew ? '' : item?.id)

  const onContextMenu = e => {
    e.preventDefault()
    if (item.type === 'qna') {
      return
    }

    ContextMenu.show(<Menu className={style.contextMenu}>{contextMenuContent}</Menu>, {
      left: e.clientX,
      top: e.clientY
    })
  }

  useEffect(() => {
    setInputValue(isEditingNew ? '' : item?.id)
  }, [isEditingNew])

  const sanitize = (name: string) => {
    return sanitizeName(name).replace(/\//g, '-')
  }

  const onKeyDown = event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      event.target.select()
    }

    if (event.key === 'Enter') {
      event.target.blur()
    }
  }

  const hasChildren = !!item.children.length
  const chevron = !isExpanded ? 'chevron-right' : 'chevron-down'
  const isTopic = level === 0
  const wfCount = item.children.filter(child => child.type !== 'qna').length
  let placeholder = lang.tr(isTopic ? 'studio.flow.sidePanel.renameTopic' : 'studio.flow.sidePanel.renameWorkflow')

  if (isEditingNew) {
    placeholder = lang.tr(isTopic ? 'studio.flow.sidePanel.nameTopic' : 'studio.flow.sidePanel.nameWorkflow')
  }

  if (isEditing) {
    return (
      <div style={{ paddingLeft: `${level * 23}px` }} className={cx(className, style.inlineEditing)}>
        {hasChildren && <Icon icon={chevron} iconSize={16} />}
        <input
          type="text"
          autoFocus
          onFocus={e => e.currentTarget.select()}
          onBlur={() => onSave(inputValue || item.id)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          onChange={e => setInputValue(sanitize(e.currentTarget.value))}
          value={inputValue}
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
      icon={hasChildren ? chevron : null}
    >
      <span className={style.topicName}>
        {item.label || item.id}
        {isTopic && item.type !== 'default' && (
          <span className={style.tag}>
            {qnaCount} Q&A · {wfCount} WF
          </span>
        )}
      </span>
    </Button>
  )
}

export default TreeItem
