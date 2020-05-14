import { Alignment, AnchorButton, Navbar, NavbarGroup, Position, Tab, Tabs, Tooltip } from '@blueprintjs/core'
import cx from 'classnames'
import React, { FC, Fragment, useState } from 'react'

import MoreOptions from '../../MoreOptions'

import style from './style.scss'
import { HeaderProps } from './typings'

const Header: FC<HeaderProps> = props => {
  const [showingOption, setShowingOption] = useState()
  return (
    <Navbar className={cx(style.header, props.className)}>
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
              <Tooltip position={Position.BOTTOM} content={button.tooltip}>
                <Fragment>
                  {!button.optionsItems?.length && (
                    <AnchorButton
                      minimal
                      small
                      onClick={button.onClick}
                      icon={button.icon}
                      disabled={button.disabled}
                    />
                  )}
                  {!!button.optionsItems?.length && (
                    <MoreOptions
                      element={
                        <AnchorButton
                          minimal
                          small
                          onClick={() => setShowingOption(index)}
                          className={cx({ active: showingOption === index })}
                          icon={button.icon}
                          disabled={button.disabled}
                        />
                      }
                      show={showingOption === index}
                      onToggle={() => setShowingOption(null)}
                      items={button.optionsItems}
                    />
                  )}
                </Fragment>
              </Tooltip>
            </div>
          ))}
        </NavbarGroup>
      )}
    </Navbar>
  )
}

export default Header
