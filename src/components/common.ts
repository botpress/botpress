export type BaseDropdown = BaseControl & { options?: BaseDropdownOptions }

export type EnumOption<T = string> = { label?: string; value: T; description?: string }

export type BaseControl = {
  type: string
  label?: string
  // The scope is the full path to the property defined in the JSON schema, the root node being represented by #
  scope?: string
}

export type AutoComplete = {
  autoComplete?: boolean
  examples?: string[]
}

export type BaseDropdownOptions = {
  items?: EnumOption[]
  placeholder?: string
  filterable?: boolean
  allowNoSelection?: boolean
}
