import { ContextMenu, Menu, MenuItem } from '@blueprintjs/core'
import React from 'react'

function MessageMenu(props) {
  return (
    <Menu>
      {props.customActions.map(c => {
        return <MenuItem key={c.id} text={c.label} onClick={e => c.onClick(props.messageId, c.id, e)} />
      })}
    </Menu>
  )
}

export const showContextMenu = (e: React.MouseEvent<HTMLDivElement>, props: any) => {
  const customActions = props.store.view.customActions
  const id = props.incomingEventId

  if (customActions && id) {
    e.preventDefault()
    const menu = <MessageMenu messageId={id} customActions={customActions} />
    ContextMenu.show(menu, { left: e.clientX, top: e.clientY })
  }
}
