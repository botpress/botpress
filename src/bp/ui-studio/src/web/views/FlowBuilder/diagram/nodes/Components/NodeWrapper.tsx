import cx from 'classnames'
import React from 'react'

import style from './style.scss'

export default ({ children, isHighlighed, onClick }) => (
  <div
    className={cx(style.nodeWrapper, { [style.highlighted]: isHighlighed })}
    onClick={onClick}
    onContextMenu={e => {
      e.stopPropagation()
      e.preventDefault()
    }}
  >
    {children}
  </div>
)
