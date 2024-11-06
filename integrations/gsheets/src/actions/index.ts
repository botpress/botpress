import { addSheet } from './implementations/add-sheet'
import { appendValues } from './implementations/append-values'
import { clearValues } from './implementations/clear-values'
import { deleteSheet } from './implementations/delete-sheet'
import { getAllSheetsInSpreadsheet } from './implementations/get-all-sheets-in-spreadsheet'
import { getInfoSpreadsheet } from './implementations/get-info-spread-sheet'
import { getNamedRanges } from './implementations/get-named-ranges'
import { getProtectedRanges } from './implementations/get-protected-ranges'
import { getValues } from './implementations/get-values'
import { moveSheetHorizontally } from './implementations/move-sheet-horizontally'
import { protectNamedRange } from './implementations/protect-named-range'
import { renameSheet } from './implementations/rename-sheet'
import { setSheetVisibility } from './implementations/set-sheet-visibility'
import { updateValues } from './implementations/update-values'
import * as bp from '.botpress'

export default {
  addSheet,
  appendValues,
  clearValues,
  deleteSheet,
  getAllSheetsInSpreadsheet,
  getInfoSpreadsheet,
  getNamedRanges,
  getProtectedRanges,
  getValues,
  moveSheetHorizontally,
  protectNamedRange,
  renameSheet,
  setSheetVisibility,
  updateValues,
} satisfies bp.IntegrationProps['actions']
