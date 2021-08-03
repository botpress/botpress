import { IconName } from '@blueprintjs/core'
import { ItemListPredicate, ItemRenderer } from '@blueprintjs/select'

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
  addBtn?: {
    text: string
    onClick: () => void
    selected?: boolean
  }
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
}
