export interface Option {
  label: string
  value: string
}

export interface DropdownProps {
  confirmChange?: {
    message: string
    acceptLabel?: string
    callback?: (value?: any) => void
  }
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
