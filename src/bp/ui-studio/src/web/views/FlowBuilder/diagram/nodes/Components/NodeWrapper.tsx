import cx from 'classnames'
import React from 'react'

import style from './style.scss'

export default ({ children, isHighlighed, isLarge, onClick }) => (
  <div
    className={cx(style.nodeWrapper, { [style.highlighted]: isHighlighed, [style.large]: isLarge })}
    onContextMenu={e => {
      e.stopPropagation()
      e.preventDefault()
    }}
    onClick={onClick}
  >
    {children}
  </div>
)
