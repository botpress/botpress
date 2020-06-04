export interface MoreInfo {
  label: string
  url?: string
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
  options?: Option[]
  fields?: FormField[]
  group?: {
    addLabel?: string // you have to specify the add button label
    minimum?: number // you can specify a minimum so the delete button won't show if there isn't more than the minimum
    contextMenu?: ContextMenu[] // you can add a contextual menu to add extra options
  }
}

export interface FormDefinition {
  advancedSettings: FormAdvancedSetting[]
  fields: FormField[]
}
