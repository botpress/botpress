import { z } from '@botpress/sdk'
import { isAxiosError } from 'axios'
import * as bp from '.botpress'

const _salesforceApiErrorSchema = z.object({
  message: z.string().optional(),
  errorCode: z.string().optional(),
  statusCode: z.string().optional(),
})
type SalesforceApiError = z.infer<typeof _salesforceApiErrorSchema>

const _salesforceOAuthErrorSchema = z.object({
  error: z.string().optional(),
  error_description: z.string().optional(),
})
type SalesforceOAuthError = z.infer<typeof _salesforceOAuthErrorSchema>

const _parseSalesforceApiError = (err: unknown): SalesforceApiError => {
  const result = _salesforceApiErrorSchema.safeParse(err)
  return result.success ? result.data : {}
}

const _parseSalesforceOAuthError = (data: unknown): SalesforceOAuthError => {
  const result = _salesforceOAuthErrorSchema.safeParse(data)
  return result.success ? result.data : {}
}

const _describeSalesforceApiError = (err: SalesforceApiError): string =>
  [err.errorCode ?? err.statusCode, err.message].filter(Boolean).join(': ') || 'Unknown Salesforce API error'

/**
 * Salesforce surfaces error details in different shapes depending on the API called:
 * - REST/SOAP calls (jsforce) throw an Error with `errorCode` and `message` set from the response body.
 * - DML results (create/update) return `{ success: false, errors: [...] }` instead of throwing.
 * - Raw HTTP calls (axios) reject with an AxiosError whose `response.data` holds the Salesforce error body.
 * - The OAuth2 token endpoint returns `{ error, error_description }` instead of the REST error shape.
 * This normalizes all of them into one descriptive, human-readable message.
 */
export const describeSalesforceError = (error: unknown): string => {
  if (Array.isArray(error)) {
    return (
      error
        .map((err) => (typeof err === 'string' ? err : _describeSalesforceApiError(_parseSalesforceApiError(err))))
        .filter(Boolean)
        .join('; ') || 'Unknown Salesforce API error'
    )
  }

  if (isAxiosError(error)) {
    const data = error.response?.data
    const status = error.response?.status

    if (Array.isArray(data)) {
      return `${describeSalesforceError(data)}${status ? ` (HTTP ${status})` : ''}`
    }

    if (data && typeof data === 'object') {
      const oauthError = _parseSalesforceOAuthError(data)
      if (oauthError.error) {
        const detail = [oauthError.error, oauthError.error_description].filter(Boolean).join(': ')
        return `${detail}${status ? ` (HTTP ${status})` : ''}`
      }
      return `${_describeSalesforceApiError(_parseSalesforceApiError(data))}${status ? ` (HTTP ${status})` : ''}`
    }

    return `${error.message}${status ? ` (HTTP ${status})` : ''}`
  }

  if (error instanceof Error) {
    return error.message
  }

  if (error && typeof error === 'object' && ('errorCode' in error || 'statusCode' in error)) {
    return _describeSalesforceApiError(_parseSalesforceApiError(error))
  }

  return String(error)
}

export const handleError = (errorMsg: string, error: unknown, logger: bp.Logger) => {
  const fullErrorMsg = `${errorMsg} ${describeSalesforceError(error)}`

  logger.forBot().error(fullErrorMsg)
  logger.forBot().debug(JSON.stringify(isAxiosError(error) ? (error.response?.data ?? error.toJSON()) : error))

  return {
    success: false,
    error: fullErrorMsg,
  } as const
}
