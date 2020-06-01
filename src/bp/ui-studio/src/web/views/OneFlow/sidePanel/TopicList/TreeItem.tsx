import { Button, ContextMenuTarget, Menu } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import React, { Fragment } from 'react'
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
  contextMenu: any
  isExpanded: boolean
  isEditing?: boolean
  qnaCount?: CountByTopic | number
}

interface State {
  inputValue: string
}

// ContextMenuTarget does not support FC components...
@ContextMenuTarget
class TreeItem extends React.Component<Props, State> {
  constructor(props) {
    super(props)

    this.state = {
      inputValue: props.item?.label || props.item?.id
    }
  }

  renderContextMenu() {
    return <Menu className={style.contextMenu}>{this.props.contextMenu}</Menu>
  }

  sanitize = (isTopic: boolean, name: string) => {
    return isTopic ? sanitizeName(name).replace(/\//g, '-') : name
  }

  onKeyDown = event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      event.target.select()
    }

    if (event.keyCode === 13) {
      // Enter
      event.target.blur()
    }
  }

  render() {
    const { item, isEditing, onClick, onDoubleClick, level, className, isExpanded, qnaCount } = this.props
    const hasChildren = !!item.children.length
    const chevron = !isExpanded ? 'chevron-right' : 'chevron-down'
    const isTopic = level === 0
    const wfCount = item.children.filter(child => child.type !== 'qna').length

    return (
      <Button
        style={{ paddingLeft: `${level * 23}px` }}
        minimal
        className={cx(className, { [style.inlineEditing]: isEditing })}
        onDoubleClick={!isEditing ? onDoubleClick : null}
        onClick={!isEditing ? onClick : null}
        icon={hasChildren ? chevron : null}
      >
        {isEditing ? (
          <input
            type="text"
            autoFocus
            onBlur={() => this.props.onSave(this.state.inputValue)}
            onKeyDown={this.onKeyDown}
            placeholder={lang.tr(
              isTopic ? 'studio.flow.sidePanel.renameTopic' : 'studio.flow.sidePanel.renameWorkflow'
            )}
            onChange={e => this.setState({ inputValue: this.sanitize(isTopic, e.currentTarget.value) })}
            value={this.state.inputValue}
          />
        ) : (
          <span className={style.topicName}>
            {item.label || item.id}
            {isTopic && item.type !== 'default' && (
              <span className={style.tag}>
                {qnaCount} Q&A · {wfCount} WF
              </span>
            )}
          </span>
        )}
      </Button>
    )
  }
}

export default TreeItem
