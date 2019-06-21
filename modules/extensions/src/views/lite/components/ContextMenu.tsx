import { ContextMenu, Menu, MenuItem } from '@blueprintjs/core'
import React from 'react'

function MessageMenu(props) {
  return (
    <Menu>
      {props.customActions.map(c => {
        return <MenuItem key={props.messageId} text={c.text} onClick={() => c.select(props.messageId)} />
      })}
    </Menu>
  )
}

export const showContextMenu = (e: React.MouseEvent<HTMLDivElement>, { id, customActions }) => {
  if (customActions && id) {
    e.preventDefault()
    const menu = <MessageMenu messageId={id} customActions={customActions} />
    ContextMenu.show(menu, { left: e.clientX, top: e.clientY })
  }
}
