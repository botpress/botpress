import style from '../../ui-shared-lite/style.scss'
import Checkbox from '../../ui-shared-lite/Checkbox'
import Collapsible from '../../ui-shared-lite/Collapsible'
import ContentSection from '../../ui-shared-lite/ContentSection'
import Icons from '../../ui-shared-lite/Icons'
import MoreOptions from '../../ui-shared-lite/MoreOptions'
import Overlay from '../../ui-shared-lite/Overlay'
import Tabs from '../../ui-shared-lite/Tabs'
import ToolTip from '../../ui-shared-lite/ToolTip'

import { sendTelemetry, startFallback } from './telemetry'
import { defaultLocale, lang, langAvaibale, langExtend, langInit, langLocale } from './translations'
import { isInputFocused } from './utils/inputs'
import { controlKey, keyMap } from './utils/keyboardShortcuts'
import { isOperationAllowed } from './AccessControl'
import { Commander } from './Commander'
import confirmDialog from './ConfirmDialog'
import contextMenu from './ContextMenu'
import { Body, Footer, Wrapper } from './Dialog'
import Dropdown from './Dropdown'
import EmptyState from './EmptyState'
import Form from './Form'
import FormFields from './Form/FormFields'
import MainContainer from './MainContainer'
import MainLayout from './MainLayout'
import MarkdownContent from './MarkdownContent'
import MultiLevelDropdown from './MultiLevelDropdown'
import ShortcutLabel from './ShortcutLabel'
import Textarea from './Textarea'
import { toast } from './Toaster'
import TreeView from './TreeView'

exports.isOperationAllowed = isOperationAllowed
exports.Checkbox = Checkbox
exports.Collapsible = Collapsible
exports.Commander = Commander
exports.ContentSection = ContentSection
exports.Dialog = { Wrapper, Footer, Body }
exports.Dropdown = Dropdown
exports.EmptyState = EmptyState
exports.MainContainer = MainContainer
exports.Form = Form
exports.FormFields = FormFields
exports.MainLayout = MainLayout
exports.MarkdownContent = MarkdownContent
exports.MoreOptions = MoreOptions
exports.MultiLevelDropdown = MultiLevelDropdown
exports.Overlay = Overlay
exports.ShortcutLabel = ShortcutLabel
exports.Tabs = Tabs
exports.Textarea = Textarea
exports.ToolTip = ToolTip
exports.TreeView = TreeView
exports.Icons = Icons
exports.sharedStyle = style

exports.contextMenu = contextMenu
exports.confirmDialog = confirmDialog
exports.lang = {
  tr: lang,
  init: langInit,
  extend: langExtend,
  getLocale: langLocale,
  getAvailable: langAvaibale,
  defaultLocale
}
exports.toast = toast
exports.utils = { controlKey, keyMap, isInputFocused }
exports.telemetry = {
  startFallback,
  sendTelemetry
}
