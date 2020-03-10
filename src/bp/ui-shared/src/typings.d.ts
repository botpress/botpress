import React from 'react'
import TooltipStyle from './style/tooltip.scss'
import { TreeViewProps } from './TreeView/typings'
import { ConfirmDialogOptions } from './ConfirmDialog/typings'
import { DropdownProps, Option } from './Dropdown/typings'

declare module 'botpress/shared' {
  export function confirmDialog(message: string | JSX.Element, options: ConfirmDialogOptions): Promise<boolean>
  export function TreeView<T>(props: TreeViewProps<T>): JSX.Element
  export function Dropdown(props: DropdownProps): JSX.Element

  export const style: { TooltipStyle }
  export { Option }
}
