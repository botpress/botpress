import { IButtonProps, ITabProps, IconName } from '@blueprintjs/core'

export interface HeaderProps {
  tabs?: ITabProps[]
  tabChange?: function
  buttons?: HeaderButtonProps[]
}

export interface HeaderButtonProps {
  onClick: function
  icon: IconName
  disabled?: boolean
}
