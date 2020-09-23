import { IButtonProps, ITabProps, IconName } from '@blueprintjs/core'
import { MoreOptionsItems } from '../../MoreOptions/typings'

export interface ToolbarProps {
  tabs?: ITabProps[]
  tabChange?: (tab: string) => void
  currentTab?: string
  buttons?: ToolbarButtonProps[]
  className?: string
}

export interface ToolbarButtonProps {
  onClick?: () => void
  icon?: IconName
  optionsWrapperClassName?: string
  content?: JSX // Allow to add custom fonctionality to a button (like adding an input in front of it)
  optionsItems?: MoreOptionsItems[]
  disabled?: boolean
  tooltip?: string
}
