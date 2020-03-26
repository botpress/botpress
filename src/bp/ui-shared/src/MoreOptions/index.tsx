import { Button, Icon } from '@blueprintjs/core'
import cx from 'classnames'
import React, { FC, Fragment } from 'react'

import style from './style.scss'
import { MoreOptionsProps } from './typings'

const MoreOptions: FC<MoreOptionsProps> = props => {
  const { show, onToggle, items } = props

  return (
    <Fragment>
      <button onClick={() => onToggle(!show)} type="button" className={cx(style.moreBtn, { [style.active]: show })}>
        <span className={style.moreBtnDots}></span>
      </button>
      {show && (
        <ul className={style.moreMenu}>
          {items.map((item, index) => (
            <li key={index}>
              {item.action && (
                <Button
                  icon={item.icon}
                  minimal
                  className={cx(style.moreMenuItem, item.className)}
                  onClick={item.action}
                >
                  {item.label}
                </Button>
              )}
              {!item.action && (
                <span className={cx(style.moreMenuItem, style.noHover, item.className)}>
                  <Icon icon={item.icon} iconSize={16} />
                  {item.label}
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
