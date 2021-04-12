import { Alignment, AnchorButton, Navbar, NavbarGroup } from '@blueprintjs/core'
import cx from 'classnames'
import React, { FC, Fragment, SetStateAction, useState } from 'react'

import MoreOptions from '../../../../ui-shared-lite/MoreOptions'
import Tabs from '../../../../ui-shared-lite/Tabs'
import ToolTip from '../../../../ui-shared-lite/ToolTip'

import style from './style.scss'
import { ToolbarProps } from './typings'

const Toolbar: FC<ToolbarProps> = props => {
  const [showingOption, setShowingOption] = useState<SetStateAction<number>>()
  return (
    <Navbar className={cx(style.header, props.className)}>
      {!!props.tabs?.length && (
        <Tabs currentTab={props.currentTab} tabChange={props.tabChange} shouldFloat tabs={props.tabs} />
      )}
      {!!props.buttons?.length && (
        <NavbarGroup className={cx(style.buttons, 'toolbar-buttons')} align={Alignment.RIGHT}>
          {props.rightContent}
          {props.buttons.map((button, index) => (
            <div key={index} className={style.btnWrapper} id={button.id}>
              <Fragment>
                {!button.optionsItems?.length && (
                  <ToolTip position="bottom" content={button.tooltip}>
                    {button.content ? (
                      button.content
                    ) : (
                      <AnchorButton
                        minimal
                        small
                        onClick={button.onClick}
                        icon={button.icon}
                        disabled={button.disabled}
                      />
                    )}
                  </ToolTip>
                )}
                {!!button.optionsItems?.length && (
                  <MoreOptions
                    className={button.optionsWrapperClassName}
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

export default Toolbar
