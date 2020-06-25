import React, { FC, Fragment, SyntheticEvent, useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'

import Overlay from '../Overlay'

import style from './style.scss'

const ContextMenuWrapper = ({ event, children }) => {
  const [clickPosition, setClickPosition] = useState({ top: `${event.clientY}px`, left: `${event.clientX}px` })
  const elPos = useRef(event.currentTarget?.getBoundingClientRect())
  const { top, bottom, right, left } = elPos.current

  const handleToggle = (e: SyntheticEvent): void => {
    e.stopPropagation()
    removeContextMenu()
  }

  const isWithinBounds = (x: number, y: number): boolean => {
    return x >= left && x <= right && y >= top && y <= bottom
  }

  return (
    <Fragment>
      <div style={clickPosition} onClick={removeContextMenu} className={style.contextMenuWrapper}>
        {children}
      </div>
      <Overlay
        onClick={handleToggle}
        onContextMenu={e => {
          if (!isWithinBounds(e.clientX, e.clientY)) {
            handleToggle(e)
            return
          }

          setClickPosition({ top: `${e.clientY}px`, left: `${e.clientX}px` })
        }}
      />
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
