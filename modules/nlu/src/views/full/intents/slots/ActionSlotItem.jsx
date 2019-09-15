import React from 'react'
import style from './style.scss'
import colors from '../colors.scss'
import classnames from 'classnames'

export default ({ slot, active, onClick }) => {
  const className = classnames(style.entityLabel, colors['label-colors-' + slot.color])
  const shortcutClassname = classnames(style.shortcutLabel, { [style.active]: active })

  return (
    <li>
      <span className={shortcutClassname}>
        Press <strong>Enter</strong>
      </span>
      <span className={className} onClick={onClick}>
        {slot.name}
      </span>
      <span className={style.type}>{slot.type}</span>
    </li>
  )
}
