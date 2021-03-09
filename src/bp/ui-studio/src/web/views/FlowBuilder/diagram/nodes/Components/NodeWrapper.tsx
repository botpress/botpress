import cx from 'classnames'
import React from 'react'

import style from './style.scss'

const DEFAULT_WIDTH = 150
const LARGE_WIDTH = 200

export default ({ children, isHighlighed, isLarge, onClick, height, width = DEFAULT_WIDTH }) => {
  if (isLarge && width === DEFAULT_WIDTH) {
    width = LARGE_WIDTH
  }

  return (
    <div
      style={{ width: width + 'px', height: height + 'px' }}
      className={cx(style.nodeWrapper, { [style.highlighted]: isHighlighed })}
      onContextMenu={e => {
        e.stopPropagation()
        e.preventDefault()
      }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
