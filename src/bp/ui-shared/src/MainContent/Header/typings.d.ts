import { IButtonProps, ITabProps, IconName } from '@blueprintjs/core'
import { MoreOptionsItems } from '../../MoreOptions/typings';

export interface HeaderProps {
  tabs?: ITabProps[]
  tabChange?: (tab: string) => void
  buttons?: HeaderButtonProps[]
  className?: string
}

export interface HeaderButtonProps {
  onClick?: () => void
  icon?: IconName
  optionsItems?: MoreOptionsItems[]
  disabled?: boolean
  tooltip?: string
}
