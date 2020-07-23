export interface FieldProps {
  placeholder?: string
  onChange?: (value: null | number | string) => void
  onBlur?: (value?: string | number | null) => void
  childRef?: (ref: HTMLElement | null) => void
  value?: string
}

export interface AddButtonProps {
  text: string
  onClick: (e: MouseEvent<HTMLElement, MouseEvent>) => void
}

export interface FieldWrapperProps {
  children: any
  label?: string
}

export interface GroupItemWrapperProps {
  children: any
  defaultCollapsed?: boolean
  contextMenu?: {
    type: string
    label: string
  }[]
  onDelete?: () => void
  label?: string
}
