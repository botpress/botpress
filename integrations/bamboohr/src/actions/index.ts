import { getCompanyInfo } from './company'
import { getEmployeeBasicInfo, getEmployeeCustomInfo, listEmployees } from './employees'
import * as bp from '.botpress'

export const actions = {
  getEmployeeBasicInfo,
  getEmployeeCustomInfo,
  listEmployees,
  getCompanyInfo,
} satisfies bp.IntegrationProps['actions']
