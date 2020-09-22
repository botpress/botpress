import { Icon } from '@blueprintjs/core'
import cx from 'classnames'
import React, { FC, Fragment, useState } from 'react'

import ToolTip from '../../../ui-shared-lite/ToolTip'

import style from './style.scss'

interface Props {
  leftButtons: any[]
  children?: JSX.Element | JSX.Element[]
}

const LayoutHeader: FC<Props> = ({ children, leftButtons }) => {
  return (
    <Fragment>
      <header className={style.toolbar}>
        <div className={style.list}>
          {leftButtons.map(({ icon, onClick, tooltip }) => {
            ;<ToolTip content={tooltip}>
              <button className={cx(style.item, style.itemSpacing)} onClick={onClick}>
                <Icon color="#1a1e22" icon={icon} iconSize={16} />
              </button>
            </ToolTip>
          })}
        </div>
      </header>
      {children}
    </Fragment>
  )
}

export default LayoutHeader
