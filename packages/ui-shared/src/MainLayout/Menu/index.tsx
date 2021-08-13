import { Icon, Position, Tooltip } from '@blueprintjs/core'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC } from 'react'
import { NavLink } from 'react-router-dom'

import style from './style.scss'
import { MenuItem, MenuProps } from './typings'

const Menu: FC<MenuProps> = ({ items, className }) => {
  const renderBasicItem = ({ name, path, icon }: MenuItem) => (
    <li id={`bp-menu_${name}`} key={path}>
      <Tooltip boundary="window" position={Position.RIGHT} content={name}>
        <NavLink to={path} title={name} activeClassName={style.active}>
          <Icon icon={icon} iconSize={16} />
        </NavLink>
      </Tooltip>
    </li>
  )

  return (
    <aside className={cx(style.sidebar, className, 'bp-sidebar')}>
      <a href="admin/" className={cx(style.logo, 'bp-logo')}>
        <img width="19" src="assets/studio/ui/public/img/logo-icon.svg" alt="Botpress Logo" />
      </a>
      {!!items?.length && <ul className={cx('nav')}>{items.map(renderBasicItem)}</ul>}
    </aside>
  )
}

export default Menu
