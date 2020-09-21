import { InvalidField } from './Form/typings'

export interface FieldProps {
  placeholder?: string
  onChange?: (value: null | number | string) => void
  onBlur?: (value?: string | number | null) => void
  childRef?: (ref: HTMLElement | null) => void
  refValue?: string
  value?: string
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
