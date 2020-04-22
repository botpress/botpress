import { Alignment, Button, Navbar, NavbarGroup, Tab, Tabs } from '@blueprintjs/core'
import React, { FC, Fragment, useState } from 'react'

import MoreOptions from '../../MoreOptions'

import style from './style.scss'
import { HeaderProps } from './typings'

const Header: FC<HeaderProps> = props => {
  const [showingOption, setShowingOption] = useState()
  return (
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
            <div key={index} className={style.btnWrapper}>
              {!button.optionsItems?.length && (
                <Button minimal small onClick={button.onClick} icon={button.icon} disabled={button.disabled} />
              )}

              {!!button.optionsItems?.length && (
                <MoreOptions
                  element={
                    <Button
                      minimal
                      small
                      onClick={() => setShowingOption(index)}
                      icon={button.icon}
                      disabled={button.disabled}
                    />
                  }
                  show={showingOption === index}
                  onToggle={() => setShowingOption(null)}
                  items={button.optionsItems}
                />
              )}
            </div>
          ))}
        </NavbarGroup>
      )}
    </Navbar>
  )
}

export default Header
