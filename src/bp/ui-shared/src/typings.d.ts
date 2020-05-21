import React from 'react'
import { TreeViewProps } from './TreeView/typings'
import { DialogProps } from './Dialog/typings'
import { ConfirmDialogOptions } from './ConfirmDialog/typings'
import { CommanderProps, QuickShortcut } from './Commander/typings'
import { DropdownProps, Option } from './Dropdown/typings'
import { MainContainerProps } from './MainContainer/typings'
import { MarkdownContentProps } from './MarkdownContent/typings'
import { MoreOptionsProps } from './MoreOptions/typings'
import { TreeViewProps } from './TreeView/typings'

import { ToastOptions } from './Toaster'
import { ShortcutLabelProps } from './ShortcutLabel/typings'
import { HeaderProps, HeaderButtonProps } from './MainContent/Header/typings'
import { WrapperProps } from './MainContent/Wrapper/typings'
import { EmptyStateProps } from './EmptyState/typings'
import { TextareaProps } from './Textarea/typings'

declare module 'botpress/shared' {
  export function Commander(props: CommanderProps): JSX.Element
  export const Dialog: {
    Wrapper(props: DialogProps): JSX.Element
    Body(props: { children: any, className?: string }): JSX.Element
    Footer(props: { children: any }): JSX.Element
  }
  export const MainContent: {
    Header(props: HeaderProps): JSX.Element
    Wrapper(props: WrapperProps): JSX.Element
  }
  export function Dropdown(props: DropdownProps): JSX.Element
  export function EmptyState(props: EmptyStateProps): JSX.Element
  export function MainContainer(props: MainContainerProps): JSX.Element
  export function MarkdownContent(props: MarkdownContentProps): JSX.Element
  export function MoreOptions(props: MoreOptionsProps): JSX.Element
  export function RightSidebar(props: { children: any }): JSX.Element
  export function ShortcutLabel(props: ShortcutLabelProps): JSX.Element
  export function Textarea<T>(props: TextareaProps<T>): JSX.Element
  export function TreeView<T>(props: TreeViewProps<T>): JSX.Element

  export function confirmDialog(message: string | JSX.Element, options: ConfirmDialogOptions): Promise<boolean>
  export const lang: {
    tr(id: string | { [lang: string]: string }, values?: { [variable: string]: any }): string
    init()
    extend(langs)
    getLocale(): string
    getAvailable(): string[]
  }

  export const toast: {
    success: (message: string | React.ReactElement, details?: string, options?: ToastOptions) => void
    failure: (message: string | React.ReactElement, details?: string, options?: ToastOptions) => void
    warning: (message: string | React.ReactElement, details?: string, options?: ToastOptions) => void
    info: (message: string | React.ReactElement, details?: string, options?: ToastOptions) => void
  }

  export const utils: {
    controlKey: string
    keyMap: { [key: string]: string }
    isInputFocused(): boolean
  }

  export { Option, MoreOptionsItems, HeaderButtonProps, QuickShortcut }
}
