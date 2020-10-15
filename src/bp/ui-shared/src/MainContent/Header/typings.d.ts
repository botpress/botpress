import { SyntheticEvent } from 'react'

export interface HeaderButton {
  id?: string
  icon: string
  onClick: (e: SyntheticEvent) => void
  tooltip?: JSX.Element | string
  divider?: boolean
  label?: string
}

export interface HeaderProps {
  rightButtons?: HeaderButton[]
  leftButtons: HeaderButton[]
  children?: JSX.Element | JSX.Element[]
}
