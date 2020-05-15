import { useEffect } from 'react'
import React, { FC } from 'react'
import { createPortal } from 'react-dom'

import style from './style.scss'
import { RightSidebarProps } from './typings'

const RightSidebar: FC<RightSidebarProps> = ({ className, canOutsideClickClose, close, children }) => {
  const mount = document.getElementById('sidebar-portal')
  const contentWrapper = document.getElementById('main-content-wrapper')
  const el = document.createElement('div')
  const classList = [style.show, className || ''].filter(Boolean)

  useEffect(() => {
    mount?.appendChild(el)
    mount?.classList.add(...classList)
    contentWrapper?.classList.add(style.wRightSidebar)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      mount?.removeChild(el)
      mount?.classList.remove(...classList)
      contentWrapper?.classList.remove(style.wRightSidebar)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [el, mount])

  const handleClickOutside = event => {
    if (!mount?.contains(event.target) && canOutsideClickClose) {
      close?.()
    }
  }

  return createPortal(children, el)
}

export default RightSidebar
