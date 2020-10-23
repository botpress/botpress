// @ts-nocheck
import { IconName } from '@blueprintjs/icons'

export interface MoreOptionsProps {
  show: boolean
  onToggle: (value: boolean) => void
  children?: any
  className?: string
  element?: JSX.Element
  items: MoreOptionsItems[]
}

export interface MoreOptionsItems {
  icon?: IconName
  label: string
  className?: string
  selected?: boolean
  content?: JSX.Element
  action?: () => void
  type?: 'delete'
}
