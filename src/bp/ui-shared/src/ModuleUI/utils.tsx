import { ContextMenu, Menu, MenuDivider, MenuItem } from '@blueprintjs/core'
import _ from 'lodash'
import React from 'react'

import { SectionAction } from './typings'

export const buildMenu = items => {
  return <Menu>{items.map(item => buildMenuItems(item))}</Menu>
}

const buildMenuItems = items => {
  if (_.isArray(items)) {
    return items.map(item => renderMenuItem(item))
  }

  return renderMenuItem(items)
}

const renderMenuItem = (element: SectionAction) => {
  if (element.type === 'divider') {
    return <MenuDivider />
  }

  return (
    <MenuItem
      id={element.id}
      key={element.label}
      text={element.label}
      icon={element.icon}
      disabled={element.disabled}
      onClick={e => !element.disabled && element.onClick && element.onClick(e)}
      tagName={'button'} // Fix for https://github.com/palantir/blueprint/issues/3352#issuecomment-464111159
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
