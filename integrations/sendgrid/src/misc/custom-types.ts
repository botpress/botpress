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

// This will be removed soon (Once I implement the remaining webhook events)
export type SendGridWebhookEvent<T extends string = string> = object & {
  /** The type of event that was triggered */
  event: T
  sg_event_id: string
  /** A SendGrid ID for a sent email message
   *
   *  @remark As far as I know, this is only absent for webhook
   *   account events (Since they aren't tied to a sent email). */
  sg_message_id?: string
  /** A Unix timestamp of when the event was triggered in SendGrid's system */
  timestamp: number
}
