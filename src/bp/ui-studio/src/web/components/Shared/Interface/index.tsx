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
import _ from 'lodash'
import React, { FC, useState } from 'react'
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
  SidePanelSectionProps,
  SplashScreenProps
} from './typings'

import { buildMenu, showContextMenu } from './utils'

export const Container: FC<ContainerProps> = props => {
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

export const SidePanelSection: FC<SidePanelSectionProps> = props => {
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
      <Collapse isOpen={isOpen} keepChildrenMounted={true}>
        {props.children}
      </Collapse>
    </React.Fragment>
  )
}

export const SearchBar: FC<SearchBarProps> = props => {
  const [text, setText] = useState('')
  const handleTextChanged = e => {
    setText(e.target.value)
    props.onChange && props.onChange(e.target.value)
  }

  return (
    <div className={style.searchBar}>
      <ControlGroup fill={true}>
        <InputGroup placeholder={props.placeholder || 'Search'} value={text} onChange={handleTextChanged} />
        <Button icon={'search'} className={Classes.FIXED} onClick={e => props.onClick && props.onClick(e)} />
      </ControlGroup>
    </div>
  )
}

export const ItemList: FC<ItemListProps> = props => {
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
                      <Icon icon={action.icon} onClick={() => action.onClick && action.onClick(item)} />
                    </Tooltip>
                  ))}
              </div>
            </div>
          )
        })}
    </div>
  )
}

export const PaddedContent: FC = props => <div style={{ padding: '5px' }}>{props.children}</div>
export const SidePanel: FC = props => <div className={style.sidePanel}>{props.children}</div>

export const KeyboardShortcut: FC<KeyboardShortcutsProps> = props => {
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

export const SplashScreen: FC<SplashScreenProps> = props => {
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

export const InfoTooltip: FC<InfoTooltipProps> = props => (
  <Tooltip content={props.text} position={props.position || Position.RIGHT}>
    {props.icon === 'help' ? (
      <MdHelpOutline className={style.infoTooltip} />
    ) : (
      <MdInfoOutline className={style.infoTooltip} />
    )}
  </Tooltip>
)

const SectionAction = (action: SectionAction, idx: number) => {
  const toolTipPos = action.tooltipPosition ? action.tooltipPosition : Position.RIGHT
  if (action.items) {
    return (
      <Tooltip key={idx} disabled={!action.tooltip} content={action.tooltip} position={toolTipPos}>
        <Popover content={buildMenu(action.items)} position={Position.BOTTOM_LEFT}>
          <Button icon={action.icon} text={action.label} />
        </Popover>
      </Tooltip>
    )
  }

  return (
    <Popover disabled={!action.popover} content={action.popover}>
      <Tooltip key={idx} disabled={!action.tooltip} content={action.tooltip} position={toolTipPos}>
        <Button
          icon={action.icon}
          text={action.label}
          onClick={e => !action.disabled && action.onClick && action.onClick(e)}
        />
      </Tooltip>
    </Popover>
  )
}

export const Toolbar = props => {
  const children: JSX.Element[] = props.children && !props.children.length ? [props.children] : props.children
  return (
    <div className={style.toolbar}>
      {children.map(c => (
        <ButtonGroup key={c.key} className={c.props.className} vertical={false} minimal={true}>
          {c}
        </ButtonGroup>
      ))}
    </div>
  )
}
