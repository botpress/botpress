import { lang, langAvaibale, langExtend, langInit, langLocale } from './translations'
import { isInputFocused } from './utils/inputs'
import { keyMap } from './utils/keyboardShortcuts'
import confirmDialog from './ConfirmDialog'
import { Body, Footer, Wrapper } from './Dialog'
import Dropdown from './Dropdown'
import MarkdownContent from './MarkdownContent'
import MoreOptions from './MoreOptions'
import ShortcutLabel from './ShortcutLabel'
import { toastFailure } from './Toaster'
import TreeView from './TreeView'

exports.Dialog = { Wrapper, Footer, Body }
exports.Dropdown = Dropdown
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
exports.toastFailure = toastFailure
exports.utils = { keyMap, isInputFocused }
