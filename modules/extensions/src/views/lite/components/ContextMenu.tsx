import { ContextMenu, Menu, MenuItem } from '@blueprintjs/core'
import React from 'react'

function MessageMenu(props) {
  return (
    <Menu>
      {props.customActions.map(action => {
        return (
          <MenuItem key={action.id} text={action.label} onClick={action.onClick.bind(this, action.id, props.element)} />
        )
      })}
    </Menu>
  )
}

export const showContextMenu = (e: React.MouseEvent<HTMLDivElement>, props: any) => {
  const customActions = props.store.view.customActions

  if (customActions && props.incomingEventId) {
    e.preventDefault()
    const menu = <MessageMenu element={props} customActions={customActions} />
    ContextMenu.show(menu, { left: e.clientX, top: e.clientY })
  }
}
