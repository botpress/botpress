import { IButtonProps, ITabProps, IconName } from '@blueprintjs/core'

export interface HeaderProps {
  tabs?: ITabProps[]
  tabChange?: () => void
  buttons?: HeaderButtonProps[]
}

export interface HeaderButtonProps {
  onClick: () => void
  icon: IconName
  disabled?: boolean
}
