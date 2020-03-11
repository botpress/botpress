import React from 'react'
import TooltipStyle from './style/tooltip.scss'
import MoreOptionsStyles from './MoreOptions/style.scss'
import { TreeViewProps } from './TreeView/typings'
import { ConfirmDialogOptions } from './ConfirmDialog/typings'
import { ButtonProps } from './Button/typings'
import { DropdownProps, Option } from './Dropdown/typings'
import { MoreOptionsProps } from './MoreOptions/typings'

declare module 'botpress/shared' {
  export function confirmDialog(message: string, options: ConfirmDialogOptions): Promise<boolean>
  export function Button(props: ButtonProps): JSX.Element
  export function Dropdown(props: DropdownProps): JSX.Element
  export function MoreOptions(props: MoreOptionsProps): JSX.Element
  export function TreeView<T>(props: TreeViewProps<T>): JSX.Element

  export const style: { TooltipStyle, MoreOptionsStyles }
  export { Option, MoreOptionsItems }
}
