import { lang, langAvaibale, langExtend, langInit, langLocale } from './translations'
import { isInputFocused } from './utils/inputs'
import { keyMap } from './utils/keyboardShortcuts'
import { Commander } from './Commander'
import confirmDialog from './ConfirmDialog'
import { Body, Footer, Wrapper } from './Dialog'
import Dropdown from './Dropdown'
import EmptyState from './EmptyState'
import MainContainer from './MainContainer'
import MainContent from './MainContent'
import MarkdownContent from './MarkdownContent'
import MoreOptions from './MoreOptions'
import ShortcutLabel from './ShortcutLabel'
import { toast } from './Toaster'
import TreeView from './TreeView'

exports.Commander = Commander
exports.Dialog = { Wrapper, Footer, Body }
exports.Dropdown = Dropdown
exports.EmptyState = EmptyState
exports.MainContainer = MainContainer
exports.MainContent = MainContent
exports.MarkdownContent = MarkdownContent
exports.MoreOptions = MoreOptions
exports.ShortcutLabel = ShortcutLabel
exports.TreeView = TreeView

exports.confirmDialog = confirmDialog
exports.lang = {
  tr: lang,
  init: langInit,
  extend: langExtend,
  getLocale: langLocale,
  getAvailable: langAvaibale
}
exports.toast = toast
exports.utils = { keyMap, isInputFocused }
