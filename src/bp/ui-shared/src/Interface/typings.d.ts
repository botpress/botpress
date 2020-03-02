import { IconName, MaybeElement, Position } from '@blueprintjs/core'
import React from 'react'
import { TreeViewProps } from '../TreeView'

export interface ConfirmDialogOptions {
  title?: string
  accept?: () => void
  decline?: () => void
  acceptLabel?: string
  declineLabel?: string
}

export interface ConfirmDialogProps extends ConfirmDialogOptions {
  message: string
  isOpen: boolean
  resolve: (ok: boolean) => void
}

declare module 'botpress/shared' {
  export function confirmDialog(message: string, options: ConfirmDialogOptions): Promise<boolean>
  export function TreeView<T>(props: TreeViewProps<T>): JSX.Element
}
