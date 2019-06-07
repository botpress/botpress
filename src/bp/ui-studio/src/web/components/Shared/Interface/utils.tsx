import { Menu, MenuDivider, MenuItem } from '@blueprintjs/core'
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
      text={element.label}
      icon={element.icon}
      onClick={e => !element.disabled && element.onClick && element.onClick(e)}
    >
      {element.items && buildMenuItems(element.items)}
    </MenuItem>
  )
}
