import React from 'react'
import { TreeViewProps } from './TreeView/typings'
import { DialogProps } from './Dialog/typings'
import { ConfirmDialogOptions } from './ConfirmDialog/typings'
import { DropdownProps, Option } from './Dropdown/typings'
import { MarkdownContentProps } from './MarkdownContent/typings'
import { MoreOptionsProps } from './MoreOptions/typings'
import { TreeViewProps } from './TreeView/typings'
import { ToastOptions } from './Toaster'
import { ShortcutLabelProps } from './ShortcutLabel/typings'

declare module 'botpress/shared' {
  export const Dialog: {
    Wrapper(props: DialogProps): JSX.Element
    Body(props: { children: any }): JSX.Element
    Footer(props: { children: any }): JSX.Element
  }
  export function Dropdown(props: DropdownProps): JSX.Element
  export function MarkdownContent(props: MarkdownContentProps): JSX.Element
  export function MoreOptions(props: MoreOptionsProps): JSX.Element
  export function ShortcutLabel(props: ShortcutLabelProps): JSX.Element
  export function TreeView<T>(props: TreeViewProps<T>): JSX.Element

  export function confirmDialog(message: string | JSX.Element, options: ConfirmDialogOptions): Promise<boolean>
  export const lang: {
    tr(id: string | { [lang: string]: string }, values?: { [variable: string]: any }): string
    init()
    extend(langs)
    getLocale(): string
    getAvailable(): string[]
  }
  export function toastFailure(message: string, details?: string, options?: ToastOptions)
  export const utils: {
    keyMap: {[key: string]: string}
    isInputFocused(): boolean
  }
  export { Option, MoreOptionsItems }
}
