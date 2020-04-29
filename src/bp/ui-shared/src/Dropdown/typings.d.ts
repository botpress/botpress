export interface Option {
  label: string
  value: string
}

export interface DropdownProps {
  filterable?: boolean
  className?: string
  items: Option[]
  defaultItem?: Option | string
  onChange: (option: Option) => void
  icon?: any
  rightIcon?: any
  small?: boolean
  spaced?: boolean
}
