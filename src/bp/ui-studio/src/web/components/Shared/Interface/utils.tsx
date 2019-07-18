import { ContextMenu, Menu, MenuDivider, MenuItem } from '@blueprintjs/core'
import _ from 'lodash'
import React from 'react'

export const buildMenu = items => {
  return <Menu>{items.map(item => buildMenuItems(item))}</Menu>
}

const buildMenuItems = items => {
  if (_.isArray(items)) {
    return items.map(item => renderMenuItem(item))
  }

  return renderMenuItem(items)
}

const renderMenuItem = element => {
  if (element.type === 'divider') {
    return <MenuDivider />
  }

  return (
    <MenuItem
      key={element.label}
      text={element.label}
      icon={element.icon}
      disabled={element.disabled}
      onClick={e => !element.disabled && element.onClick && element.onClick(e)}
    >
      {element.items && buildMenuItems(element.items)}
    </MenuItem>
  )
}

export const showContextMenu = (e: React.MouseEvent<HTMLDivElement>, contextMenu) => {
  if (contextMenu) {
    e.preventDefault()
    ContextMenu.show(buildMenu(contextMenu), { left: e.clientX, top: e.clientY })
  }
}
