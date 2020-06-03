import React, { FC } from 'react'

import style from './style.scss'
import { OverlayProps } from './typings'

const Overlay: FC<OverlayProps> = ({ onClick }) => (
  <div onContextMenu={e => e.preventDefault()} className={style.overlay} onClick={onClick}></div>
)

export default Overlay
