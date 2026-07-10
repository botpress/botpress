import * as sdk from '@botpress/sdk'

export const getErrorMessage = (thrown: unknown): string => (thrown instanceof Error ? thrown.message : String(thrown))

const fieldLookupActionByModel: Record<string, string> = {
  'crm.lead': 'listLeadFields',
  'res.partner': 'listContactFields',
}

export const createOdooRuntimeError = (thrown: unknown): sdk.RuntimeError => {
  const message = getErrorMessage(thrown)
  const invalidFieldMatch = /Invalid field '([^']+)' (?:on|in) '([^']+)'/.exec(message)

  if (invalidFieldMatch) {
    const [, field, model] = invalidFieldMatch
    const fieldLookupAction = model ? fieldLookupActionByModel[model] : undefined
    const fieldLookupSuggestion = fieldLookupAction
      ? `call ${fieldLookupAction} to see the available fields for this Odoo database`
      : 'call the matching field-list action to see the available fields for this Odoo database'

    return new sdk.RuntimeError(
      `Invalid Odoo field "${field}" for model "${model}". Remove this field from the request or ${fieldLookupSuggestion}.`
    )
  }

  return new sdk.RuntimeError(message)
}

export const isActiveUserLinkedContactError = (message: string): boolean =>
  message.includes('You cannot delete contacts linked to an active user')
