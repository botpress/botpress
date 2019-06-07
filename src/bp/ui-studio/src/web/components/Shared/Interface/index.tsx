import { Collapse, Position, Tooltip } from '@blueprintjs/core'
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
    <div className={style.container}>
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
        <strong>{props.label || ''}</strong>
        <div>{props.actions && props.actions.map((action, idx) => SectionAction(action, idx))}</div>
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
  const Icon: any = props.icon
  return (
    <div className={style.splashScreen}>
      <div>
        {typeof Icon === 'function' ? <Icon /> : Icon}
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
  const Icon: any = action.icon
  return (
    <Tooltip key={idx} content={action.label} position={Position.BOTTOM}>
      <a
        className={classnames(style.action_button, { [style.action_disabled]: action.disabled })}
        onClick={e => {
          e.stopPropagation()
          !action.disabled && action.onClick(e)
        }}
      >
        {typeof Icon === 'function' ? <Icon /> : Icon}
      </a>
    </Tooltip>
  )
}
