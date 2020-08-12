import { Alignment, AnchorButton, Navbar, NavbarGroup, Position, Tab, Tabs } from '@blueprintjs/core'
import cx from 'classnames'
import React, { FC, Fragment, SetStateAction, useState } from 'react'

import MoreOptions from '../../../../ui-shared-lite/MoreOptions'
import ToolTip from '../../../../ui-shared-lite/ToolTip'

import style from './style.scss'
import { HeaderProps } from './typings'

const Header: FC<HeaderProps> = props => {
  const [showingOption, setShowingOption] = useState<SetStateAction<number>>()
  return (
    <Navbar className={cx(style.header, props.className)}>
      {!!props.tabs?.length && (
        <NavbarGroup>
          <Tabs id="headerTabs" onChange={props.tabChange}>
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
              <Fragment>
                {!button.optionsItems?.length && (
                  <ToolTip position="bottom" content={button.tooltip}>
                    <AnchorButton
                      minimal
                      small
                      onClick={button.onClick}
                      icon={button.icon}
                      disabled={button.disabled}
                    />
                  </ToolTip>
                )}
                {!!button.optionsItems?.length && (
                  <MoreOptions
                    element={
                      <ToolTip position="bottom" content={button.tooltip}>
                        <AnchorButton
                          minimal
                          small
                          onClick={() => setShowingOption(index)}
                          className={cx({ active: showingOption === index })}
                          icon={button.icon}
                          disabled={button.disabled}
                        />
                      </ToolTip>
                    }
                    show={showingOption === index}
                    onToggle={() => setShowingOption(undefined)}
                    items={button.optionsItems}
                  />
                )}
              </Fragment>
            </div>
          ))}
        </NavbarGroup>
      )}
    </Navbar>
  )
}

export default Header
