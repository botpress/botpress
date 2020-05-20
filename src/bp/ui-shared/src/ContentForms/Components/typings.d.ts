export interface FieldProps {
  placeholder?: string
  onChange?: (value: null | number | string) => void
  value: string
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
  contextMenu: {
    type: string
    label: string
  }[]
  onDelete?: () => void
  label?: string
}
