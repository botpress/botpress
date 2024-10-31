import { addSheet } from './implementations/add-sheet'
import { appendValues } from './implementations/append-values'
import { clearValues } from './implementations/clear-values'
import { getInfoSpreadsheet } from './implementations/get-info-spread-sheet'
import { getValues } from './implementations/get-values'
import { updateValues } from './implementations/update-values'
import * as bp from '.botpress'

export default {
  getValues,
  getInfoSpreadsheet,
  clearValues,
  appendValues,
  addSheet,
  updateValues,
} satisfies bp.IntegrationProps['actions']
