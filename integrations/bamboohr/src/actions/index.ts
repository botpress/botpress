import { getCompanyInfo } from './company'
import {
  getEmployeeBasicInfo,
  getEmployeeSensitiveInfo,
  getEmployeeCustomInfo,
  getEmployeePhoto,
  listEmployees,
} from './employees'

export const actions = {
  getEmployeeBasicInfo,
  getEmployeeSensitiveInfo,
  getEmployeeCustomInfo,
  getEmployeePhoto,
  listEmployees,
  getCompanyInfo,
}
