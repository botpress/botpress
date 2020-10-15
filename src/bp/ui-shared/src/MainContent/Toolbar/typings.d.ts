import { IButtonProps, IconName } from '@blueprintjs/core'
import { MoreOptionsItems } from '../../MoreOptions/typings'
import { Tab } from '../../../../ui-shared-lite/Tabs/typings'

export interface ToolbarProps {
  tabs?: Tab[]
  tabChange?: (tab: string) => void
  currentTab?: string
  buttons?: ToolbarButtonProps[]
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
