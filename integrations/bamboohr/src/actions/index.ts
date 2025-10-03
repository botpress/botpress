import { RuntimeError } from '@botpress/sdk'
import { getCompanyInfo } from './company'
import {
  getEmployeeBasicInfo,
  getEmployeeSensitiveInfo,
  getEmployeeCustomInfo,
  getEmployeePhoto,
  listEmployees,
} from './employees'

import * as bp from '.botpress'

const actionErrorWrapper = <T extends (...args: any) => Promise<any>>(fn: T): T =>
  (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args)
    } catch (err) {
      throw new RuntimeError('Action failed.', err as Error)
    }
  }) as T

export const actions = {
  getEmployeeBasicInfo: actionErrorWrapper(getEmployeeBasicInfo),
  getEmployeeSensitiveInfo: actionErrorWrapper(getEmployeeSensitiveInfo),
  getEmployeeCustomInfo: actionErrorWrapper(getEmployeeCustomInfo),
  getEmployeePhoto: actionErrorWrapper(getEmployeePhoto),
  listEmployees: actionErrorWrapper(listEmployees),
  getCompanyInfo: actionErrorWrapper(getCompanyInfo),
} satisfies bp.IntegrationProps['actions']
