import classnames from 'classnames'
import React, { FC, Fragment } from 'react'

import style from './style.scss'

interface Props {
  show: boolean
  onToggle: (value: boolean) => void
  children?: any
}

const MoreOptions: FC<Props> = props => {
  const { show, onToggle } = props

  const activeClass = show && style.active

  return (
    <Fragment>
      <button onClick={() => onToggle(!show)} type="button" className={classnames(style.moreBtn, activeClass)}>
        <span className={style.moreBtnDots}></span>
      </button>
      {show && <ul className={style.moreMenu}>{props.children}</ul>}
      {show && <div className={style.overlay} onClick={() => onToggle(false)}></div>}
    </Fragment>
  )
}

export default MoreOptions
