import React, { FC, Fragment, SyntheticEvent, useEffect } from 'react'
import ReactDOM from 'react-dom'

import Overlay from '../Overlay'

import style from './style.scss'

const ContextMenuWrapper = ({ event, children }) => {
  const elPos = event.currentTarget.getBoundingClientRect()

  const handleToggle = e => {
    e.stopPropagation()
    removeContextMenu()
  }

  return (
    <Fragment>
      <div
        style={{ top: `${elPos.top + elPos.height}px`, left: `${elPos.left + elPos.width / 2}px` }}
        className={style.contextMenuWrapper}
      >
        {children}
      </div>
      <Overlay onClick={handleToggle} />
    </Fragment>
  )
}
const contextMenu = (e: SyntheticEvent, content: JSX.Element) => {
  e.preventDefault()
  e.stopPropagation()

  const body = document.getElementsByTagName('body')[0]
  const div = document.createElement('div')

  div.setAttribute('id', 'context-menu-container')
  body.appendChild(div)

  ReactDOM.render(<ContextMenuWrapper event={e}>{content}</ContextMenuWrapper>, div)
}

function removeContextMenu() {
  const div = document.getElementById('context-menu-container') as HTMLElement
  const body = document.getElementsByTagName('body')[0]

  body.removeChild(div)
}

export default contextMenu
