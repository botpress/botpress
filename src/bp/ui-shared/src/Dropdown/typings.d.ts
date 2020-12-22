import { IconName } from '@blueprintjs/core'
import { ItemListPredicate, ItemRenderer } from '@blueprintjs/select'

export interface Option {
  label: string
  value: any
  icon?: IconName | JSX.Element
}

export interface DropdownProps {
  confirmChange?: {
    message: string
    acceptLabel?: string
    callback?: (value?: any) => void
  }
  hideActiveItemIcon?: boolean
  children?: any
  placeholder?: string
  filterPlaceholder?: string
  filterable?: boolean
  className?: string
  items: Option[]
  defaultItem?: Option | string
  onChange: (option: Option) => void
  icon?: any
  rightIcon?: any
  small?: boolean
  spaced?: boolean
  filterList?: (query: string, options: Option[]) => Option[]
  customItemRenderer?: (item, { handleClick, modifiers }) => JSX.Element | null
}
