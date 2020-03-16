export interface Option {
  label: string
  value: string
}

export interface DropdownProps {
  items: Option[]
  defaultItem?: Option
  onChange: (option: Option) => void
  icon?: any
  rightIcon?: any
  small?: boolean
  spaced?: boolean
}
