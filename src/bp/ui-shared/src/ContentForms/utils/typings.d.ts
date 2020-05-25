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
  type: 'checkbox' | 'group' | 'group' | 'group' | 'select' | 'text' | 'textarea' | 'upload' | 'url'
  key: string
  label: string
  placeholder?: string
  addLabel?: string
  options?: Option[]
  fields?: FormField[]
  minimum?: number;
  contextMenu?: ContextMenu[]
}

export interface FormEntity {
  advancedSettings: FormAdvancedSetting[]
  fields: FormField[]
}
