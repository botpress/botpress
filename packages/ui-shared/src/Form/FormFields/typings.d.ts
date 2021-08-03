import { InvalidField } from './Form/typings'

export interface FieldProps {
  placeholder?: string
  onChange?: (value: null | number | string) => void
  onBlur?: (value?: string | number | null) => void
  childRef?: (ref: HTMLElement | null) => void
  refValue?: string
  value?: string
}

export interface SelectProps extends FieldProps {
  data: FormData
  field: FormField
  axios?: any
  parent?
  printField?
}

export interface AddButtonProps {
  className?: string
  text: string
  onClick: (e: MouseEvent<HTMLElement, MouseEvent>) => void
}

export interface GroupItemWrapperProps {
  children: any
  defaultCollapsed?: boolean
  borderTop?: boolean
  contextMenu?: {
    type: string
    label: string
  }[]
  onDelete?: () => void
  label?: string
}

export interface TextFieldsArrayProps {
  addBtnLabel: string
  addBtnLabelTooltip?: string
  refValue?: string[]
  items: string[]
  moreInfo?: JSX.Element
  label?: string
  validation?: {
    regex?: RegExp
    list?: any[]
    validator?: (items: any[], newItem: any) => boolean
  }
  onChange: (items: string[]) => void
  getPlaceholder?: (index: number) => string
}

export interface FieldWrapperProps {
  children: any
  label?: string
  invalid?: InvalidField
}

export type TextProps = FieldProps & { field: FormField }

export type SupportedFileType = 'image' | 'audio' | 'video' | 'file'

export interface UploadFieldProps extends FieldProps {
  axios: any
  customPath?: string
  onChange?: (url: string | undefined) => void
  type: SupportedFileType
  filter?: string
}
