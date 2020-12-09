export interface ConfirmDialogOptions {
  title?: string
  accept?: () => void
  decline?: () => void
  acceptLabel?: string
  declineLabel?: string
  showDecline?: boolean
  body?: JSX.Element
}

export interface ConfirmDialogProps extends ConfirmDialogOptions {
  message: string
  isOpen: boolean
  resolve: (ok: boolean) => void
}
