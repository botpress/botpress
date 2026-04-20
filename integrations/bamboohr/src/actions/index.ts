import { getCompanyInfo } from './company'
import { getEmployeeBasicInfo, getEmployeeCustomInfo, listEmployees, getFields } from './employees'
import * as bp from '.botpress'

export const actions = {
  getEmployeeBasicInfo,
  getEmployeeCustomInfo,
  listEmployees,
  getCompanyInfo,
  getFields,
} satisfies bp.IntegrationProps['actions']
