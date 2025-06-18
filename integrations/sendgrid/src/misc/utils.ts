import { RuntimeError } from '@botpress/sdk'
import { SendGridResponseError } from './custom-types'

/** A helper function that allows me to check if an unknown value
 *  is a non-null object that contains the specified property.
 *
 *  @remark This exists since `Object.prototype.hasOwnProperty` doesn't
 *   smart cast the value into an object type containing the property. */
const isNonNullObjectAndHasProperty = <K extends PropertyKey>(
  value: unknown,
  property: K
): value is object & Record<K, unknown> => typeof value === 'object' && value?.hasOwnProperty(property) === true

export const isSendGridError = (thrown: unknown): thrown is SendGridResponseError => {
  return (
    isNonNullObjectAndHasProperty(thrown, 'response') &&
    isNonNullObjectAndHasProperty(thrown.response, 'body') &&
    isNonNullObjectAndHasProperty(thrown.response.body, 'errors') &&
    'code' in thrown
  )
}

export const parseError = (thrown: unknown) => {
  if (isSendGridError(thrown)) {
    const errorMessage = thrown.response.body.errors[0]?.message ?? thrown.message
    return new RuntimeError(
      `SendGrid API yielded an error with status code: "${thrown.code}", and message: "${errorMessage}"`,
      thrown
    )
  }

  if (thrown instanceof RuntimeError) {
    return thrown
  }

  return thrown instanceof Error ? new RuntimeError(thrown.message, thrown) : new RuntimeError(String(thrown))
}
