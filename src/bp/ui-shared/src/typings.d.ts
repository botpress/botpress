import React from 'react'
import TooltipStyle from './style/tooltip.scss'
import { BaseDialogProps } from './BaseDialog/typings'
import { ConfirmDialogOptions } from './ConfirmDialog/typings'
import { DropdownProps, Option } from './Dropdown/typings'
import { TreeViewProps } from './TreeView/typings'
import { ToastOptions } from './Toaster'
import { ShortcutLabelProps } from './ShortcutLabel/typings'

declare module 'botpress/shared' {
  export function BaseDialog(props: BaseDialogProps): JSX.Element
  export function DialogBody(props: { children: any }): JSX.Element
  export function DialogFooter(props: { children: any }): JSX.Element
  export function confirmDialog(message: string | JSX.Element, options: ConfirmDialogOptions): Promise<boolean>
  export function Dropdown(props: DropdownProps): JSX.Element
  export function isInputFocused(): boolean
  export function ShortcutLabel(props: ShortcutLabelProps): JSX.Element
  export function TreeView<T>(props: TreeViewProps<T>): JSX.Element
  export const lang: {
    tr(id: string | { [lang: string]: string }, values?: { [variable: string]: any }): string
    init()
    extend(langs)
    getLocale(): string
    getAvailable(): string[]
  }
  export function toastFailure(message: string, details?: string, options?: ToastOptions)
  export const keyMap: {[key: string]: string}
  export const style: { TooltipStyle }
  export { Option }
}
