import React from 'react'
import { Position } from '@blueprintjs/core'

export interface ContainerProps {
  /**
   * Change the default width of the sidebar (in pixels)
   * @default 300
   */
  sidebarWidth?: number
  /**
   * Sets the default state of the sidebar. When not visible, the width is set to 0px, but can be expanded manually
   */
  sidebarHidden: boolean
  readonly children: React.ReactChildren
}

export interface SplashScreenProps {
  title: string
  description: string
  /** Supply either a function or an element which will render the button */
  icon: Function | JSX.Element
  readonly children: React.ReactChildren
}

export interface InfoTooltipProps {
  /** The text displayed when the cursor is over the icon */
  text: string
  /** The icon to display. By default it will use info */
  icon?: 'info' | 'help'
  /** Where the tooltip will be directed. By default, it's right */
  position: Position
}

export interface SectionProps {
  /** When true, the content of the section is displayed by default */
  expanded: boolean
  /** The label to display as the section header */
  label: string
  /** An array of actions that can be executed by the user */
  actions: SectionAction[]
  readonly children: React.ReactChildren
}

interface SectionAction {
  /** This text will be displayed when the mouse is over the icon */
  label: string
  /** When true, the button is still visible but the click event is discarded */
  disabled: boolean
  /** Supply either a function or an element which will render the button */
  icon: Function | JSX.Element
  /** The function called when the action is clicked */
  onClick: (e: React.MouseEvent) => void
}

export interface KeyboardShortcutsProps {
  label: string
  /**
   * An array of the different keys for the shortcut. There is a special key called ACTION, which will display the correct key for windows/mac
   * Example: keys: ["ACTION", "shift", "p"] will display: ctrl + shift + p
   */
  keys: string[]
}
