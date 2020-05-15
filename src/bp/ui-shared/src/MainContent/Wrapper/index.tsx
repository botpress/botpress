import React, { FC } from 'react'

import style from './style.scss'
import { WrapperProps } from './typings'

const Wrapper: FC<WrapperProps> = props => {
  const { childRef, children } = props
  return (
    <div id="main-content-wrapper" ref={ref => childRef?.(ref)} className={style.wrapper}>
      {...children}
      <div className={style.rightSidebar} id="sidebar-portal"></div>
    </div>
  )
}

export default Wrapper
