import React, { FC } from 'react'

import style from './style.scss'

const StickyActionBar: FC = props => {
  return (
    <div className={style.stickyActionBar}>
      <div className={style.stickyActionBarContent}>{props.children}</div>
    </div>
  )
}

export default StickyActionBar
