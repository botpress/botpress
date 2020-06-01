import { Button, ContextMenuTarget, Menu } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import React from 'react'
import { sanitizeName } from '~/util'

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
    const { item, isEditing, onClick, onDoubleClick, level, className, isExpanded } = this.props
    const hasChildren = !!item.children.length
    const chevron = !isExpanded ? 'chevron-right' : 'chevron-down'
    const isTopic = level === 0

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
          item.label || item.id
        )}
      </Button>
    )
  }
}

export default TreeItem
