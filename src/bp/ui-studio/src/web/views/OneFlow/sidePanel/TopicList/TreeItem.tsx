import { Button, ContextMenuTarget, Menu, MenuItem } from '@blueprintjs/core'
import React, { FC } from 'react'

interface Props {
  className?: string
  item: any
  onClick: () => void
  level: number
  contextMenu: any
}

// ContextMenuTarget does not support FC components...
@ContextMenuTarget
class TreeItem extends React.Component<Props, {}> {
  renderContextMenu() {
    return this.props.contextMenu
  }

  handleSave() {
    console.log('save')
  }

  handleDelete() {
    console.log('delete')
  }

  render() {
    const { item, onClick, level, className } = this.props
    const hasChildren = !!item.children.length

    return (
      <Button
        style={{ paddingLeft: `${level * 23}px` }}
        minimal
        className={className}
        onClick={onClick}
        icon={hasChildren ? `chevron-down` : null}
      >
        {item.label || item.id}
      </Button>
    )
  }
}

export default TreeItem
