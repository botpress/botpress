import * as sdk from '@botpress/sdk'

export const getErrorMessage = (thrown: unknown): string => (thrown instanceof Error ? thrown.message : String(thrown))

export const createOdooRuntimeError = (thrown: unknown): sdk.RuntimeError => {
  const message = getErrorMessage(thrown)
  const invalidFieldMatch = /Invalid field '([^']+)' on '([^']+)'/.exec(message)

  if (invalidFieldMatch) {
    const [, field, model] = invalidFieldMatch

    return new sdk.RuntimeError(
      `Invalid Odoo field "${field}" for model "${model}". Remove this field from the request or call getContactFields to see the available contact fields for this Odoo database.`
    )
  }

  return new sdk.RuntimeError(message)
}

export const isActiveUserLinkedContactError = (message: string): boolean =>
  message.includes('You cannot delete contacts linked to an active user')
