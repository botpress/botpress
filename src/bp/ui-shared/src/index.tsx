import TooltipStyle from './style/tooltip.scss'
import { lang, langExtend, langInit, langLocale } from './translations'
import confirmDialog from './ConfirmDialog'
import TreeView from './TreeView'

exports.confirmDialog = confirmDialog
exports.style = { TooltipStyle }
exports.TreeView = TreeView
exports.lang = {
  tr: lang,
  init: langInit,
  extend: langExtend,
  locale: langLocale
}
