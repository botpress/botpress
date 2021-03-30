import { IButtonProps, IconName } from '@blueprintjs/core'

import { Tab } from '../../../../ui-shared-lite/Tabs/typings'
import { MoreOptionsItems } from '../../MoreOptions/typings'

export interface ToolbarProps {
  tabs?: Tab[]
  tabChange?: (tab: string) => void
  currentTab?: string
  buttons?: ToolbarButtonProps[]
  rightContent?: Jsx
  className?: string
}

export interface ToolbarButtonProps {
  id?: string
  onClick?: () => void
  icon?: IconName
  optionsWrapperClassName?: string
  content?: JSX // Allow to add custom fonctionality to a button (like adding an input in front of it)
  optionsItems?: MoreOptionsItems[]
  disabled?: boolean
  tooltip?: string
}
