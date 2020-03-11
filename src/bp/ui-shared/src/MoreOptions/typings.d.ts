import { IconName } from "@blueprintjs/icons"

export interface MoreOptionsProps {
  show: boolean
  onToggle: (value: boolean) => void
  children?: any
  items: MoreOptionsItems[]
}

export interface MoreOptionsItems {
  icon?: IconName
  iconSize?: number
  label: string
  action?: () => void
  className?: string
}
