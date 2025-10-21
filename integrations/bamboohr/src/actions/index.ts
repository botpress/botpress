import { RuntimeError } from '@botpress/sdk'
import { getCompanyInfo } from './company'
import { getEmployeeBasicInfo, getEmployeeSensitiveInfo, getEmployeeCustomInfo, listEmployees } from './employees'

import * as bp from '.botpress'

const actionErrorWrapper = <T extends (...args: any) => Promise<any>>(fn: T): T =>
  (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args)
    } catch (err) {
      throw new RuntimeError('Action failed: ' + (err as Error).message)
    }
  }) as T

export const actions = {
  getEmployeeBasicInfo: actionErrorWrapper(getEmployeeBasicInfo),
  getEmployeeSensitiveInfo: actionErrorWrapper(getEmployeeSensitiveInfo),
  getEmployeeCustomInfo: actionErrorWrapper(getEmployeeCustomInfo),
  listEmployees: actionErrorWrapper(listEmployees),
  getCompanyInfo: actionErrorWrapper(getCompanyInfo),
} satisfies bp.IntegrationProps['actions']
