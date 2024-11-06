import { addSheet } from './implementations/add-sheet'
import { appendValues } from './implementations/append-values'
import { clearValues } from './implementations/clear-values'
import { deleteSheet } from './implementations/delete-sheet'
import { getAllSheetsInSpreadsheet } from './implementations/get-all-sheets-in-spreadsheet'
import { getInfoSpreadsheet } from './implementations/get-info-spread-sheet'
import { getValues } from './implementations/get-values'
import { renameSheet } from './implementations/rename-sheet'
import { updateValues } from './implementations/update-values'
import * as bp from '.botpress'

export default {
  addSheet,
  appendValues,
  clearValues,
  deleteSheet,
  getAllSheetsInSpreadsheet,
  getInfoSpreadsheet,
  getValues,
  renameSheet,
  updateValues,
} satisfies bp.IntegrationProps['actions']
