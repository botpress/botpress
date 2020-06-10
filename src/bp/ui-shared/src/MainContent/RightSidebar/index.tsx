import { useEffect } from 'react'
import React from 'react'
import { createPortal } from 'react-dom'

import style from './style.scss'

const RightSidebar = ({ children }) => {
  const mount = document.getElementById('sidebar-portal')
  const contentWrapper = document.getElementById('main-content-wrapper')
  const el = document.createElement('div')

  useEffect(() => {
    mount?.appendChild(el)
    mount?.classList.add(style.show)
    contentWrapper?.classList.add(style.wRightSidebar)

    return () => {
      mount?.removeChild(el)
      mount?.classList.remove(style.show)
      contentWrapper?.classList.remove(style.wRightSidebar)
    }
  }, [el, mount])

  return createPortal(children, el)
}

export default RightSidebar
