import { SyntheticEvent } from 'react'

export interface HeaderButton {
  element?: JSX.Element
  icon?: JSX.Element | string
  onClick?: (e: SyntheticEvent) => void
  tooltip?: JSX.Element | string
  divider?: boolean
  label?: string
}

export interface HeaderProps {
  rightButtons?: HeaderButton[]
  leftButtons: HeaderButton[]
  children?: JSX.Element | JSX.Element[]
}
