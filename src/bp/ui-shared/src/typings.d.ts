import React from 'react'
import TooltipStyle from './style/tooltip.scss'
import { BaseDialogProps } from './BaseDialog/typings'
import { ConfirmDialogOptions } from './ConfirmDialog/typings'
import { DropdownProps, Option } from './Dropdown/typings'
import { TreeViewProps } from './TreeView/typings'

declare module 'botpress/shared' {
  export function BaseDialog(props: BaseDialogProps): JSX.Element
  export function DialogBody(props: { children: any }): JSX.Element
  export function DialogFooter(props: { children: any }): JSX.Element
  export function confirmDialog(message: string, options: ConfirmDialogOptions): Promise<boolean>
  export function Dropdown(props: DropdownProps): JSX.Element
  export function TreeView<T>(props: TreeViewProps<T>): JSX.Element

  export const style: { TooltipStyle }
  export { Option }
}
