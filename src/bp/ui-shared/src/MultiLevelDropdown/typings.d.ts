import { ItemListPredicate, ItemRenderer } from '@blueprintjs/select'
import { IconName } from '@blueprintjs/core'

export interface Option {
  label: string
  value: any
  icon?: IconName | JSX.Element
}

export interface Item {
  name: string
  items: Option[]
}

export interface MultiLevelDropdownProps {
  confirmChange?: {
    message: string
    acceptLabel?: string
    callback?: (value?: any) => void
  }
  children?: any
  placeholder?: string
  filterPlaceholder?: string
  filterable?: boolean
  className?: string
  items: Item[]
  defaultItem?: Option
  onChange: (option: Option) => void
  icon?: any
  rightIcon?: any
  small?: boolean
  spaced?: boolean
  filterList?: (query: string, options: Option[]) => Option[]
  customItemRenderer?: (item, { handleClick, modifiers }) => JSX.Element | null
}
