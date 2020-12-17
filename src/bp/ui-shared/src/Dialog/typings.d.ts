import { IDialogProps } from '@blueprintjs/core'

export interface DialogProps extends IDialogProps {
  onSubmit?: () => void
  children: any
  isOpen?: boolean
  height?: number
  size?: 'sm' | 'md' | 'lg'
}
