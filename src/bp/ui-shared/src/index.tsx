import { lang, langAvaibale, langExtend, langInit, langLocale } from './translations'
import { isInputFocused } from './utils/inputs'
import { keyMap } from './utils/keyboardShortcuts'
import { BaseDialog, DialogBody, DialogFooter } from './BaseDialog'
import confirmDialog from './ConfirmDialog'
import Dropdown from './Dropdown'
import MarkdownContent from './MarkdownContent'
import MoreOptions from './MoreOptions'
import ShortcutLabel from './ShortcutLabel'
import { toastFailure } from './Toaster'
import TreeView from './TreeView'

exports.BaseDialog = { Dialog: BaseDialog, DialogFooter, DialogBody }
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
