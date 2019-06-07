import { Button, ButtonGroup, Collapse, Icon, Popover, Position, Tooltip } from '@blueprintjs/core'
import classnames from 'classnames'
import React, { useEffect, useState } from 'react'
import { MdHelpOutline, MdInfoOutline } from 'react-icons/md'
import SplitPane from 'react-split-pane'

import style from './style.scss'
import {
  ContainerProps,
  InfoTooltipProps,
  KeyboardShortcutsProps,
  SectionAction,
  SectionProps,
  SplashScreenProps
} from './typings'

import { buildMenu } from './utils'

export const Container = (props: ContainerProps) => {
  const [sidebarVisible, setSidebarVisible] = useState(!props.sidebarHidden)

  const handleToggleShortcut = e => {
    e.ctrlKey && e.key === 'b' && setSidebarVisible(!sidebarVisible)
  }

  const width = props.sidebarWidth ? props.sidebarWidth : 300
  window.toggleSidebar = () => setSidebarVisible(!sidebarVisible)

  useEffect(() => {
    document.addEventListener('keydown', handleToggleShortcut)
    return function cleanup() {
      document.removeEventListener('keydown', handleToggleShortcut)
    }
  })

  return (
    <div className={classnames(style.container, { [style.sidebar_hidden]: !sidebarVisible })}>
      <SplitPane split="vertical" defaultSize={width} size={sidebarVisible ? width : 0}>
        {props.children}
      </SplitPane>
    </div>
  )
}

export const Section = (props: SectionProps) => {
  const [isOpen, setOpen] = useState(props.expanded)

  return (
    <React.Fragment>
      <div className={style.sidebar_section} onClick={() => setOpen(!isOpen)}>
        <strong>
          {!props.hideCaret && <Icon icon={isOpen ? 'caret-down' : 'caret-right'} />}
          {props.label || ''}
        </strong>
        <ButtonGroup minimal={true} onClick={e => e.stopPropagation()}>
          {props.actions && props.actions.map((action, idx) => SectionAction(action, idx))}
        </ButtonGroup>
      </div>
      <Collapse isOpen={isOpen}>{props.children}</Collapse>
    </React.Fragment>
  )
}

export const PaddedContent = props => <div style={{ padding: '5px' }}>{props.children}</div>
export const Sidebar = props => <div className={style.sidebar}>{props.children}</div>

export const KeyboardShortcut = (props: KeyboardShortcutsProps) => {
  const ACTION_KEY = navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? 'cmd' : 'ctrl'
  return (
    <p>
      {props.label || ''}
      &nbsp;
      {props.keys &&
        props.keys.map((key, idx) => {
          const realKey = key === 'ACTION' ? ACTION_KEY : key
          return idx > 0 ? (
            <span key={idx}>
              &nbsp;+&nbsp;
              <kbd>{realKey}</kbd>
            </span>
          ) : (
            <kbd key={idx}>{realKey}</kbd>
          )
        })}
    </p>
  )
}

export const SplashScreen = (props: SplashScreenProps) => {
  return (
    <div className={style.splashScreen}>
      <div>
        <Icon icon={props.icon} />
        <h1>{props.title || ''}</h1>
        <p>{props.description || ''}</p>
        {props.children}
      </div>
    </div>
  )
}

export const InfoTooltip = (props: InfoTooltipProps) => (
  <Tooltip content={props.text} position={props.position || Position.RIGHT}>
    {props.icon === 'help' ? (
      <MdHelpOutline className={style.infoTooltip} />
    ) : (
      <MdInfoOutline className={style.infoTooltip} />
    )}
  </Tooltip>
)

const SectionAction = (action: SectionAction, idx: number) => {
  if (action.items) {
    return (
      <Tooltip key={idx} content={action.tooltip} position={Position.BOTTOM}>
        <Popover content={buildMenu(action.items)} position={Position.BOTTOM_LEFT}>
          <Button icon={action.icon} text={action.label} />
        </Popover>
      </Tooltip>
    )
  }

  return (
    <Tooltip key={idx} content={action.tooltip} position={Position.BOTTOM}>
      <Button icon={action.icon} text={action.label} />
    </Tooltip>
  )
}
