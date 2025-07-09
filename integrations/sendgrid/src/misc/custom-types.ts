import type { ResponseError } from '@sendgrid/helpers/classes'

// ============ Common Types ============

/** A type for modifying the structure of another type */
export type Merge<T, R> = Omit<T, keyof R> & R

// ============ Send Grid ============

/** An overridden type of the SendGrid 'ResponseError'
 *  because the response body is not always a string type.
 *
 *  @remark While it may still be possible for the body
 *   to be a string, the validation check I'm doing in
 *   'utils.ts' asserts that the body is an object &
 *   that it contains a property called "errors". */
export type SendGridResponseError = Merge<
  ResponseError,
  { response: Merge<ResponseError['response'], { body: SendGridErrorResponseBody }> }
>

type SendGridError = {
  /** The error message that describes why the request failed */
  message: string
  /** The property that caused the error (if applicable) */
  field: string | null
  /** A url that links to the documentation on why the error occurred and how to fix it (if applicable) */
  help: string | null
}

type SendGridErrorResponseBody = {
  errors: SendGridError[]
}
