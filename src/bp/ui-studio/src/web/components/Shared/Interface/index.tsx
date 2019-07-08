import {
  Button,
  ButtonGroup,
  Classes,
  Collapse,
  Colors,
  ControlGroup,
  Icon,
  InputGroup,
  Popover,
  Position,
  Tooltip
} from '@blueprintjs/core'
import classnames from 'classnames'
import _ from 'lodash'
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
  SidePanelProps,
  SidePanelSectionProps,
  SplashScreenProps,
  ToolbarButtonsProps,
  ToolbarProps
} from './typings'
import { buildMenu, showContextMenu } from './utils'

export const Container = (props: ContainerProps) => {
  const [sidePanelVisible, setSidePanelVisible] = useState(!props.sidePanelHidden)
  const width = props.sidePanelWidth ? props.sidePanelWidth : 300

  const toggleSidePanel = () => setSidePanelVisible(!sidePanelVisible)
  window.toggleSidePanel = toggleSidePanel

  const keyHandlers = {
    ...(props.keyHandlers || {}),
    'toggle-sidepanel': toggleSidePanel
  }

  const childs = React.Children.toArray(props.children)
  return (
    <HotKeys handlers={keyHandlers} keyMap={props.keyMap || {}} className={style.fullsize} focused>
      <div className={classnames(style.container, { [style.sidePanel_hidden]: !sidePanelVisible })}>
        <SplitPane split={'vertical'} defaultSize={width} size={sidePanelVisible ? width : 0}>
          {childs[0]}
          <div className={style.fullsize}>{childs.slice(1)}</div>
        </SplitPane>
      </div>
    </HotKeys>
  )
}

export const SidePanelSection = (props: SidePanelSectionProps) => {
  const [isOpen, setOpen] = useState(!props.collapsed)

  return (
    <React.Fragment>
      <div className={style.sidePanel_section} onClick={() => setOpen(!isOpen)}>
        <strong>
          {!props.hideCaret && <Icon icon={isOpen ? 'caret-down' : 'caret-right'} />}
          {props.label || ''}
        </strong>
        <ButtonGroup minimal={true} onClick={e => e.stopPropagation()}>
          {props.actions && props.actions.map(action => SectionAction(action))}
        </ButtonGroup>
      </div>
      <Collapse isOpen={isOpen} transitionDuration={50} keepChildrenMounted={true}>
        {props.children}
      </Collapse>
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
        <InputGroup
          leftIcon={props.icon}
          placeholder={props.placeholder || 'Search'}
          value={text}
          onChange={handleTextChanged}
        />
        {props.showButton && (
          <Button
            icon={'search'}
            className={Classes.FIXED}
            onClick={e => props.onButtonClick && props.onButtonClick(e)}
          />
        )}
      </ControlGroup>
    </div>
  )
}

export const ItemList = (props: ItemListProps) => {
  return (
    <div className={style.itemList}>
      {props.items &&
        props.items.map(item => {
          const key = item.key ? item.key : item.label
          return (
            <div key={key} className={classnames(style.item, { [style.itemListSelected]: item.selected })}>
              <div
                className={style.label}
                onClick={() => props.onElementClicked && props.onElementClicked(item)}
                onContextMenu={e => showContextMenu(e, item.contextMenu)}
              >
                {item.icon && <Icon icon={item.icon} />} {item.label}
              </div>
              <div className={style.right}>
                {item.actions &&
                  item.actions.map(action => (
                    <Tooltip key={key + action.tooltip} content={action.tooltip} position={Position.RIGHT}>
                      <Icon
                        style={{ padding: '0 7px' }} // so it has the same padding of a button
                        icon={action.icon}
                        color={Colors.GRAY2}
                        onClick={() => action.onClick && action.onClick(item)}
                      />
                    </Tooltip>
                  ))}
              </div>
            </div>
          )
        })}
    </div>
  )
}

export const PaddedContent = props => <div style={{ padding: '5px' }}>{props.children}</div>
export const SidePanel = (props: SidePanelProps) => <div className={style.sidePanel}>{props.children}</div>

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

export const SplashScreen = (props: SplashScreenProps) => (
  <div className={style.splashScreen}>
    <div>
      <Icon icon={props.icon} />
      <h1>{props.title || ''}</h1>
      <p>{props.description || ''}</p>
      {props.children}
    </div>
  </div>
)

const SectionAction = (action: SectionAction) => {
  const key = action.key || action.label || action.tooltip
  if (action.items) {
    return (
      <Tooltip key={key} disabled={!action.tooltip} content={action.tooltip} position={Position.RIGHT}>
        <Popover content={buildMenu(action.items)} position={Position.BOTTOM_LEFT}>
          <Button icon={action.icon} text={action.label} />
        </Popover>
      </Tooltip>
    )
  }

  return (
    <Popover key={key} disabled={!action.popover} content={action.popover}>
      <Tooltip disabled={!action.tooltip} content={action.tooltip} position={Position.RIGHT}>
        <Button
          disabled={action.disabled}
          icon={action.icon}
          text={action.label}
          onClick={e => {
            action.onClick && action.onClick(e)
          }}
        />
      </Tooltip>
    </Popover>
  )
}

export const Toolbar = (props: ToolbarProps) => {
  return <div className={style.toolbar}>{props.children}</div>
}

export const LeftToolbarButtons = (props: ToolbarButtonsProps) => {
  return <ButtonGroup minimal={true}>{props.children}</ButtonGroup>
}

export const RightToolbarButtons = (props: ToolbarButtonsProps) => {
  return (
    <ButtonGroup className={style.rightButtons} minimal={true}>
      {props.children}
    </ButtonGroup>
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
