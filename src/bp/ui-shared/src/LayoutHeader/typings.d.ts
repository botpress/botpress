import { SyntheticEvent } from 'react'

export interface LayoutHeaderButton {
  icon: string
  onClick: (e: SyntheticEvent) => void
  tooltip?: JSX.Element | string
  divider?: boolean
  label?: string
}

export interface LayoutHeaderProps {
  rightButtons?: LayoutHeaderButton[]
  leftButtons: LayoutHeaderButton[]
  children?: JSX.Element | JSX.Element[]
}
