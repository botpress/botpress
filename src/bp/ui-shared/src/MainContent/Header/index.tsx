import { Alignment, AnchorButton, Navbar, NavbarGroup, Tab, Tabs, Tooltip } from '@blueprintjs/core'
import React, { FC } from 'react'

import style from './style.scss'
import { HeaderProps } from './typings'

const Header: FC<HeaderProps> = props => (
  <Navbar className={style.header}>
    {!!props.tabs?.length && (
      <NavbarGroup>
        <Tabs onChange={props.tabChange}>
          {props.tabs.map(tab => (
            <Tab key={tab.id} id={tab.id} title={tab.title} />
          ))}
        </Tabs>
      </NavbarGroup>
    )}
    {!!props.buttons?.length && (
      <NavbarGroup className={style.buttons} align={Alignment.RIGHT}>
        {props.buttons.map((button, index) => (
          <Tooltip content={button.tooltip}>
            <AnchorButton
              key={index}
              minimal
              small
              onClick={button.onClick}
              icon={button.icon}
              disabled={button.disabled}
            />
          </Tooltip>
        ))}
      </NavbarGroup>
    )}
  </Navbar>
)

export default Header
