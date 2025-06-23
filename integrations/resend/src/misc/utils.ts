import { RuntimeError } from '@botpress/client/src'
import { ErrorResponse } from 'resend'
import { HttpStatus } from './HttpStatus'
import { ResendError } from './ResendError'

/** A helper function that allows me to check if an unknown value
 *  is a non-null object that contains the specified property.
 *
 *  @remark This exists since `Object.prototype.hasOwnProperty` doesn't
 *   smart cast the value into an object type containing the property. */
const isNonNullObjectAndHasProperty = <K extends PropertyKey>(
  value: unknown,
  property: K
): value is object & Record<K, unknown> => typeof value === 'object' && value?.hasOwnProperty(property) === true

export const isResendError = (thrown: unknown): thrown is ErrorResponse => {
  return isNonNullObjectAndHasProperty(thrown, 'message') && 'name' in thrown && !(thrown instanceof Error)
}

export const parseError = (thrown: unknown) => {
  if (isResendError(thrown)) {
    return new RuntimeError(
      `Resend API yielded an error of type: "${thrown.name}", and message: "${thrown.message}"`,
      new ResendError(thrown)
    )
  }

  if (thrown instanceof RuntimeError) {
    return thrown
  }

  return thrown instanceof Error ? new RuntimeError(thrown.message, thrown) : new RuntimeError(String(thrown))
}

/** A helper that groups a raw numeric status code with
 *   its reason phrase so bot developers don't have to
 *   web search the status code's meaning.
 *
 *   @see https://datatracker.ietf.org/doc/html/rfc1945#section-6.1.1 */
export const formatStatusCode = (code: number) => ({
  code,
  reasonPhrase: HttpStatus[code] ?? null,
})
