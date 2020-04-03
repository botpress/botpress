import { lang, langExtend, langInit, langLocale } from './translations'
import { BaseDialog, DialogBody, DialogFooter } from './BaseDialog'
import confirmDialog from './ConfirmDialog'
import Dropdown from './Dropdown'
import MarkdownContent from './MarkdownContent'
import MoreOptions from './MoreOptions'
import { toastFailure } from './Toaster'
import TreeView from './TreeView'

exports.BaseDialog = BaseDialog
exports.DialogFooter = DialogFooter
exports.DialogBody = DialogBody
exports.confirmDialog = confirmDialog
exports.TreeView = TreeView
exports.lang = {
  tr: lang,
  init: langInit,
  extend: langExtend,
  locale: langLocale
}
exports.MarkdownContent = MarkdownContent
exports.toastFailure = toastFailure
exports.Dropdown = Dropdown
exports.MoreOptions = MoreOptions
exports.TreeView = TreeView
