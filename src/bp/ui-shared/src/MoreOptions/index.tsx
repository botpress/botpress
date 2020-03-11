import { Icon } from '@blueprintjs/core'
import classnames from 'classnames'
import React, { FC, Fragment } from 'react'

import Button from '../Button'

import style from './style.scss'
import { MoreOptionsProps } from './typings'

const MoreOptions: FC<MoreOptionsProps> = props => {
  const { show, onToggle, items } = props

  const activeClass = show && style.active

  const renderLabel = item => {
    return (
      <Fragment>
        {item.icon && <Icon icon={item.icon} iconSize={item.iconSize} />}
        {item.label}
      </Fragment>
    )
  }

  return (
    <Fragment>
      <button onClick={() => onToggle(!show)} type="button" className={classnames(style.moreBtn, activeClass)}>
        <span className={style.moreBtnDots}></span>
      </button>
      {show && (
        <ul className={style.moreMenu}>
          {items.map((item, index) => (
            <li key={index}>
              {item.action && (
                <Button className={classnames(style.moreMenuItem, item.className)} onClick={item.action}>
                  {renderLabel(item)}
                </Button>
              )}
              {!item.action && (
                <span className={classnames(style.moreMenuItem, style.noHover, item.className)}>
                  {renderLabel(item)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {show && <div className={style.overlay} onClick={() => onToggle(false)}></div>}
    </Fragment>
  )
}

export default MoreOptions
