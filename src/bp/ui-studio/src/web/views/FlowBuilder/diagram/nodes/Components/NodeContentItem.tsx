import cx from 'classnames'
import React, { FC } from 'react'

import style from './style.scss'

interface Props {
  onEdit: () => void
  className?: string
  children: any
}

const NodeContentItem: FC<Props> = ({ onEdit, className, children }) => {
  return (
    <button className={cx('content-wrapper', style.contentWrapper, className)} onClick={onEdit}>
      {children}
    </button>
  )
}

export default NodeContentItem
