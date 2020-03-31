import TooltipStyle from './style/tooltip.scss'
import { lang, langExtend, langInit, langLocale } from './translations'
import { BaseDialog, DialogBody, DialogFooter } from './BaseDialog'
import confirmDialog from './ConfirmDialog'
import Dropdown from './Dropdown'
import MoreOptions from './MoreOptions'
import MoreOptionsStyles from './MoreOptions/style.scss'
import TreeView from './TreeView'

exports.BaseDialog = BaseDialog
exports.DialogFooter = DialogFooter
exports.DialogBody = DialogBody
exports.confirmDialog = confirmDialog
exports.style = { TooltipStyle }
exports.TreeView = TreeView
exports.lang = {
  tr: lang,
  init: langInit,
  extend: langExtend,
  locale: langLocale
}
exports.Dropdown = Dropdown
exports.MoreOptions = MoreOptions
exports.TreeView = TreeView
exports.style = { TooltipStyle, MoreOptionsStyles }
