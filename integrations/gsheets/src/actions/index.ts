import { addSheet } from './add-sheet'
import { appendValues } from './append-values'
import { clearValues } from './clear-values'
import { getInfoSpreadsheet } from './get-info-spread-sheet'
import { getValues } from './get-values'
import { updateValues } from './update-values'
import * as bp from '.botpress'

export default {
  getValues,
  getInfoSpreadsheet,
  clearValues,
  appendValues,
  addSheet,
  updateValues,
} satisfies bp.IntegrationProps['actions']
