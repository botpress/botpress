export interface MoreInfo {
  label: string
  url: string
}

export interface FormAdvancedSetting {
  key: string
  label: string
  type: string
  moreInfo?: MoreInfo
}

export interface Option {
  value: string
  label: string
  related: FormField
}

export interface ContextMenu {
  type: string
  label: string
}

export interface FormField {
  type: 'checkbox' | 'group' | 'select' | 'text' | 'textarea' | 'upload' | 'url'
  key: string
  label: string
  placeholder?: string
  addLabel?: string // when in a group, you have to specify the add button label
  options?: Option[]
  fields?: FormField[]
  minimum?: number // when in a group, you can specify a minimum so the delete button won't show if there isn't more than the minimum
  contextMenu?: ContextMenu[] // when in a group, you can add a contextual menu to add extra options
}

export interface FormDefinition {
  advancedSettings: FormAdvancedSetting[]
  fields: FormField[]
}
