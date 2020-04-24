import { IconName } from "@blueprintjs/icons"

export interface MoreOptionsProps {
  show: boolean
  onToggle: (value: boolean) => void
  children?: any
  element?: JSX.Element
  items: MoreOptionsItems[]
}

export interface MoreOptionsItems {
  icon?: IconName
  label: string
  selected?: boolean
  action?: () => void
  type?: 'delete'
}
