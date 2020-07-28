import { useEffect } from 'react'
import React, { FC } from 'react'

import style from './style.scss'
import { RightSidebarProps } from './typings'

const RightSidebar: FC<RightSidebarProps> = ({ className, canOutsideClickClose, close, children }) => {
  let container
  const contentWrapper = document.getElementById('main-content-wrapper')
  const classList = [style.show, className || ''].filter(Boolean)

  useEffect(() => {
    container = document.getElementById('sidebar-container')
    contentWrapper?.classList.add(style.wRightSidebar)
    container?.classList.add(...classList)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      contentWrapper?.classList.remove(style.wRightSidebar)
      container?.classList.remove(...classList)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [children])

  const handleClickOutside = event => {
    if (
      !container?.contains(event.target) &&
      !event.target?.closest('.tagify__dropdown') &&
      !event.target?.closest('.more-options-more-menu') &&
      !event.target?.closest('.toolbar-buttons') &&
      canOutsideClickClose
    ) {
      close?.()
    }
  }

  return (
    <div className={style.rightSidebar} id="sidebar-container">
      {children}
    </div>
  )
}

export default RightSidebar
