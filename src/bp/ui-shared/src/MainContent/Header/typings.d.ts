import { IButtonProps, ITabProps, IconName } from '@blueprintjs/core'
import { MoreOptionsItems } from '../../MoreOptions/typings'

export interface HeaderProps {
  tabs?: ITabProps[]
  tabChange?: (tab: string) => void
  currentTab?: string
  buttons?: HeaderButtonProps[]
  className?: string
}

export interface HeaderButtonProps {
  onClick?: () => void
  icon?: IconName
  optionsWrapperClassName?: string
  content?: JSX // Allow to add custom fonctionality to a button (like adding an input in front of it)
  optionsItems?: MoreOptionsItems[]
  disabled?: boolean
  tooltip?: string
}
