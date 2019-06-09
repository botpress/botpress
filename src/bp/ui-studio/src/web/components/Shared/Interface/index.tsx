import {
  Button,
  ButtonGroup,
  Classes,
  Collapse,
  ControlGroup,
  Icon,
  InputGroup,
  Popover,
  Position,
  Tooltip
} from '@blueprintjs/core'
import classnames from 'classnames'
import React, { useState } from 'react'
import { HotKeys } from 'react-hotkeys'
import { MdHelpOutline, MdInfoOutline } from 'react-icons/md'
import SplitPane from 'react-split-pane'

import style from './style.scss'
import {
  ContainerProps,
  InfoTooltipProps,
  ItemListProps,
  KeyboardShortcutsProps,
  SearchBarProps,
  SectionAction,
  SectionProps,
  SplashScreenProps
} from './typings'

import { buildMenu, prepareKeyBindings } from './utils'

export const Container = (props: ContainerProps) => {
  const [sidePanelVisible, setSidePanelVisible] = useState(!props.sidePanelHidden)
  const width = props.sidePanelWidth ? props.sidePanelWidth : 300

  const toggleSidePanel = () => setSidePanelVisible(!sidePanelVisible)
  window.toggleSidePanel = toggleSidePanel

  const { keys, handlers } = prepareKeyBindings(props.keyBindings)

  return (
    <HotKeys
      handlers={{ ...(handlers || {}), 'toggle-sidepanel': toggleSidePanel }}
      keyMap={keys || {}}
      focused
      style={{ width: '100%', height: '100%' }}
    >
      <div className={classnames(style.container, { [style.sidePanel_hidden]: !sidePanelVisible })}>
        <SplitPane split="vertical" defaultSize={width} size={sidePanelVisible ? width : 0}>
          {props.children}
        </SplitPane>
      </div>
    </HotKeys>
  )
}

export const SidePanelSection = (props: SectionProps) => {
  const [isOpen, setOpen] = useState(!props.collapsed)

  return (
    <React.Fragment>
      <div className={style.sidePanel_section} onClick={() => setOpen(!isOpen)}>
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

export const SearchBar = (props: SearchBarProps) => {
  const [text, setText] = useState('')
  const handleTextChanged = e => {
    setText(e.target.value)
    props.onChange && props.onChange(e.target.value)
  }

  return (
    <div className={style.searchBar}>
      <ControlGroup fill={true}>
        <InputGroup placeholder={props.placeholder || 'Search'} value={text} onChange={handleTextChanged} />
        <Button icon="search" className={Classes.FIXED} onClick={e => props.onClick && props.onClick(e)} />
      </ControlGroup>
    </div>
  )
}

export const ItemList = (props: ItemListProps) => {
  return (
    <div className={style.itemList}>
      <ul>
        {props.items &&
          props.items.map((item, idx) => (
            <li key={idx}>
              <div style={{ width: '80%' }} onClick={() => props.onElementClicked && props.onElementClicked(item)}>
                {item.label}
              </div>
              <div style={{ marginLeft: 'auto ' }}>
                {props.actions &&
                  props.actions.map(action => (
                    <Tooltip key={idx + action.tooltip} content={action.tooltip} position={Position.RIGHT}>
                      <Icon icon={action.icon} onClick={() => action.onClick && action.onClick(item)} />
                    </Tooltip>
                  ))}
              </div>
            </li>
          ))}
      </ul>
    </div>
  )
}

export const PaddedContent = props => <div style={{ padding: '5px' }}>{props.children}</div>
export const SidePanel = props => <div className={style.sidePanel}>{props.children}</div>

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
            <span key={realKey}>
              &nbsp;+&nbsp;
              <kbd>{realKey}</kbd>
            </span>
          ) : (
            <kbd key={realKey}>{realKey}</kbd>
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
      <Button
        icon={action.icon}
        text={action.label}
        onClick={e => !action.disabled && action.onClick && action.onClick(e)}
      />
    </Tooltip>
  )
}
