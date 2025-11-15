import { DiagnosticStatus, DiagnosticIssue, DiagnosticCategory } from '../types'

export const CATEGORY_PROJECT: DiagnosticCategory = 'project'
export const CATEGORY_ENV: DiagnosticCategory = 'env'
export const CATEGORY_SDK: DiagnosticCategory = 'sdk'
export const CATEGORY_AUTH: DiagnosticCategory = 'auth'
export const CATEGORY_NETWORK: DiagnosticCategory = 'network'

export function _createIssue(
  id: string,
  category = CATEGORY_ENV,
  status: DiagnosticStatus,
  message: string,
  details?: Record<string, any>,
  suggestion?: string
): DiagnosticIssue {
  return {
    id,
    category,
    status,
    message,
    details,
    suggestion,
  }
}
