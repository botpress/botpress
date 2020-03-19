import React from 'react'
import TooltipStyle from './style/tooltip.scss'
import MoreOptionsStyles from './MoreOptions/style.scss'
import { TreeViewProps } from './TreeView/typings'
import { BaseDialogProps } from './BaseDialog/typings'
import { ConfirmDialogOptions } from './ConfirmDialog/typings'
import { ButtonProps } from './Button/typings'
import { DropdownProps, Option } from './Dropdown/typings'
import { MoreOptionsProps } from './MoreOptions/typings'

declare module 'botpress/shared' {
  export function BaseDialog(props: BaseDialogProps): JSX.Element
  export function Button(props: ButtonProps): JSX.Element
  export function confirmDialog(message: string | JSX.Element, options: ConfirmDialogOptions): Promise<boolean>
  export function DialogBody(props: { children: any }): JSX.Element
  export function DialogFooter(props: { children: any }): JSX.Element
  export function Dropdown(props: DropdownProps): JSX.Element
  export function MoreOptions(props: MoreOptionsProps): JSX.Element
  export function TreeView<T>(props: TreeViewProps<T>): JSX.Element

  export const style: { TooltipStyle, MoreOptionsStyles }
  export { Option, MoreOptionsItems }
}
