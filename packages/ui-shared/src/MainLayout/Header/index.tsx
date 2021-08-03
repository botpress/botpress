import { Icon, IconName } from '@blueprintjs/core'
import cx from 'classnames'
import React, { FC, Fragment, useState } from 'react'

import ToolTip from '../../../../ui-shared-lite/ToolTip'

import style from './style.scss'
import { HeaderProps } from './typings'

const Header: FC<HeaderProps> = ({ children, rightButtons, leftButtons }) => {
  return (
    <Fragment>
      <header className={style.header}>
        {!!rightButtons?.length && (
          <div className={style.list}>
            {rightButtons.map(({ divider, icon, label, onClick, tooltip }, index) => {
              return (
                <Fragment key={index}>
                  {divider && <span className={style.divider}></span>}
                  <ToolTip content={tooltip}>
                    <button className={cx(style.item, style.itemSpacing)} onClick={onClick}>
                      <Icon color="#1a1e22" icon={icon as IconName} iconSize={16} />
                      {label && <span className={style.label}>{label}</span>}
                    </button>
                  </ToolTip>
                </Fragment>
              )
            })}
          </div>
        )}
        <div className={style.list}>
          {leftButtons.map(({ divider, icon, label, onClick, tooltip, element }, index) => {
            return (
              <Fragment key={index}>
                {divider && <span className={style.divider}></span>}
                <ToolTip content={tooltip}>
                  {element ? (
                    element
                  ) : (
                    <button className={cx(style.item, style.itemSpacing)} onClick={onClick}>
                      <Icon color="#1a1e22" icon={icon as IconName} iconSize={16} />
                      {label && <span className={style.label}>{label}</span>}
                    </button>
                  )}
                </ToolTip>
              </Fragment>
            )
          })}
        </div>
      </header>
      {children}
    </Fragment>
  )
}

export default Header
