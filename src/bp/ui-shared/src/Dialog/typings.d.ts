import { IDialogProps } from '@blueprintjs/core'

export interface DialogProps extends IDialogProps {
  onSubmit?: () => void
  children: any
  isOpen?: boolean
  size?: 'sm' | 'md' | 'lg'
}
