import React from 'react'

import style from './style.scss'

export default ({ children }) => (
  <div
    className={style.nodeWrapper}
    onContextMenu={e => {
      e.stopPropagation()
      e.preventDefault()
    }}
  >
    {children}
  </div>
)
