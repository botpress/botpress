import { IButtonProps, ITabProps, IconName } from '@blueprintjs/core'

export interface HeaderProps {
  tabs?: ITabProps[]
  tabChange?: (tab: string) => void
  buttons?: HeaderButtonProps[]
}

export interface HeaderButtonProps {
  onClick: () => void
  icon: IconName
  disabled?: boolean
  tooltip?: string
}
