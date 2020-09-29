import React from 'react'
import { TreeViewProps } from './TreeView/typings'
import { DialogProps } from './Dialog/typings'
import { ConfirmDialogOptions } from './ConfirmDialog/typings'
import { CommanderProps, QuickShortcut } from './Commander/typings'
import { DropdownProps, Option } from './Dropdown/typings'
import { MainContainerProps } from './MainContainer/typings'
import { MarkdownContentProps } from './MarkdownContent/typings'
import { TreeViewProps } from './TreeView/typings'

import { ToastOptions } from './Toaster'
import { ShortcutLabelProps } from './ShortcutLabel/typings'
import { ToolbarProps, ToolbarButtonProps } from './MainContent/Toolbar/typings'
import { WrapperProps } from './MainContent/Wrapper/typings'
import { EmptyStateProps } from './EmptyState/typings'
import { TextareaProps } from './Textarea/typings'
import { RightSidebarProps } from './MainContent/RightSidebar/typings'
import { FormProps } from './Contents/Components/Form/typings'
import { ItemProps } from './Contents/Components/Item/typings'
import { AddButtonProps } from './Contents/Components/typings'
import { SelectProps } from './FormFields/Select'
import { TextFieldsArrayProps } from './FormFields/TextFieldsArray/typings'
import { SuperInputArrayProps } from './FormFields/SuperInputArray/typings'
import { OverlayProps } from './Overlay/typings'
import { FormField, MultiLangText } from 'botpress/sdk'
import { CheckboxProps } from '../../ui-shared-lite/Checkbox/typings'
import { MoreOptionsProps } from '../../ui-shared-lite/MoreOptions/typings'
import { ContentSectionProps } from '../../ui-shared-lite/ContentSection/typings'
import { CollapsibleProps } from '../../ui-shared-lite/Collapsible/typings'
import { OverlayProps } from '../../ui-shared-lite/Overlay/typings'
import { ToolTipProps } from '../../ui-shared-lite/ToolTip/typings'
import { TabsProps } from '../../ui-shared-lite/Tabs/typings'
import { VariablePickerProps } from './FormFields/VariablePicker/typings'
import { MultiLevelDropdownProps } from './MultiLevelDropdown/typings'
import { FieldWrapperProps } from './FormFields/FieldWrapper/typings'
import { MenuProps, MenuItem } from './MainContent/Menu/typings'
import { HeaderProps, HeaderButton } from './MainContent/Header/typings'

declare module 'botpress/shared' {
  export function Checkbox(props: CheckboxProps): JSX.Element
  export function Collapsible(props: CollapsibleProps): JSX.Element
  export function Commander(props: CommanderProps): JSX.Element
  export const Dialog: {
    Wrapper(props: DialogProps): JSX.Element
    Body(props: { children: any; className?: string }): JSX.Element
    Footer(props: { children: any }): JSX.Element
  }
  export const MainContent: {
    Toolbar(props: ToolbarProps): JSX.Element
    Header(props: HeaderProps): JSX.Element
    Wrapper(props: WrapperProps): JSX.Element
    Menu(props: MenuProps): JSX.Element
    RightSidebar(props: RightSidebarProps): JSX.Element
  }
  export const Contents: {
    Form(props: FormProps): JSX.Element
    Item(props: ItemProps): JSX.Element
    createEmptyDataFromSchema: (fields: FormField[], lang?: string) => any
  }
  export const FormFields: {
    AddButton(props: AddButtonProps): JSX.Element
    FieldWrapper(props: FieldWrapperProps): JSX.Element
    Select(props: SelectProps): JSX.Element
    TextFieldsArray(props: TextFieldsArrayProps): JSX.Element
    SuperInputArray(props: SuperInputArrayProps): JSX.Element
    VariablePicker(props: VariablePickerProps): JSX.Element
  }
  export function Dropdown(props: DropdownProps): JSX.Element
  export function EmptyState(props: EmptyStateProps): JSX.Element
  export function MainContainer(props: MainContainerProps): JSX.Element
  export function MarkdownContent(props: MarkdownContentProps): JSX.Element
  export function MoreOptions(props: MoreOptionsProps): JSX.Element
  export function MultiLevelDropdown(props: MultiLevelDropdownProps): JSX.Element
  export function Overlay(props: OverlayProps): JSX.Element
  export function ShortcutLabel(props: ShortcutLabelProps): JSX.Element
  export function ContentSection<T>(props: ContentSectionProps<T>): JSX.Element
  export function Tabs<T>(props: TabsProps<T>): JSX.Element
  export function Textarea<T>(props: TextareaProps<T>): JSX.Element
  export function ToolTip<T>(props: ToolTipProps<T>): JSX.Element
  export function TreeView<T>(props: TreeViewProps<T>): JSX.Element

  export function contextMenu(event: SyntheticEvent, content: JSX.Element, onClose?: () => void): void
  export function confirmDialog(message: string | JSX.Element, options: ConfirmDialogOptions): Promise<boolean>
  export const lang: {
    tr(id: string | MultiLangText, values?: { [variable: string]: any }): string
    init()
    extend(langs)
    getLocale(): string
    getAvailable(): string[]
    defaultLocale: string
  }

  export const telemetry: {
    startFallback(api: AxiosInstance): Promise<void>
    sendTelemetry(events: TelemetryEvent[]): boolean
  }

  export const Icons: {
    Brackets(): JSX.Element
    Minimize(): JSX.Element
    Say(): JSX.Element
    Search(): JSX.Element
  }

  export const toast: {
    dismiss: (key: string) => void
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

  export const sharedStyle: CssExports

  export { Option, MoreOptionsItems, HeaderButtonProps, QuickShortcut, MenuItem, HeaderButton }
}

declare global {
  interface Window {
    BOT_API_PATH: string
    API_PATH: string
    TELEMETRY_URL: string
  }
}
