export interface ConfirmDialogOptions {
  title?: string
  accept?: () => void
  decline?: () => void
  acceptLabel?: string
  declineLabel?: string
  size?: 'sm' | 'md' | 'lg'
}

export interface ConfirmDialogProps extends ConfirmDialogOptions {
  message: string
  isOpen: boolean
  resolve: (ok: boolean) => void
}
