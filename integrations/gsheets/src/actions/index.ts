import { addSheet } from './implementations/add-sheet'
import { appendValues } from './implementations/append-values'
import { clearValues } from './implementations/clear-values'
import { createNamedRangeInSheet } from './implementations/create-named-range-in-sheet'
import { deleteRows } from './implementations/delete-rows'
import { deleteSheet } from './implementations/delete-sheet'
import { findRow } from './implementations/find-row'
import { findRows } from './implementations/find-rows'
import { getAllSheetsInSpreadsheet } from './implementations/get-all-sheets-in-spreadsheet'
import { getInfoSpreadsheet } from './implementations/get-info-spread-sheet'
import { getNamedRanges } from './implementations/get-named-ranges'
import { getProtectedRanges } from './implementations/get-protected-ranges'
import { getRow } from './implementations/get-row'
import { getValues } from './implementations/get-values'
import { insertRowAtIndex } from './implementations/insert-row-at-index'
import { moveSheetHorizontally } from './implementations/move-sheet-horizontally'
import { protectNamedRange } from './implementations/protect-named-range'
import { renameSheet } from './implementations/rename-sheet'
import { setSheetVisibility } from './implementations/set-sheet-visibility'
import { setValues } from './implementations/set-values'
import { unprotectRange } from './implementations/unprotect-range'
import { updateRow } from './implementations/update-row'
import { upsertRow } from './implementations/upsert-row'
import * as bp from '.botpress'

export default {
  addSheet,
  appendValues,
  clearValues,
  createNamedRangeInSheet,
  deleteRows,
  deleteSheet,
  findRow,
  findRows,
  getAllSheetsInSpreadsheet,
  getInfoSpreadsheet,
  getNamedRanges,
  getProtectedRanges,
  getRow,
  getValues,
  insertRowAtIndex,
  moveSheetHorizontally,
  protectNamedRange,
  renameSheet,
  setSheetVisibility,
  setValues,
  unprotectRange,
  updateRow,
  upsertRow,
} as const satisfies bp.IntegrationProps['actions']
