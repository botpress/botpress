import { Merge } from '@botpress/sdk/dist/utils/type-utils'
import { CreateEmailResponse, Resend } from 'resend'
import { HttpStatus } from '../misc/HttpStatus'
import { formatStatusCode, parseError } from '../misc/utils'
import * as bp from '.botpress'

type SendEmailResponse = Merge<CreateEmailResponse, { error: CreateEmailResponse['error'] & { statusCode?: unknown } }>

/** The resend package doesn't provide the status
 *  code if the sendEmail request was successful.
 *
 *  This is the success status code I received
 *  when I tested in Postman. */
const DEFAULT_SUCCESS_STATUS: HttpStatus = HttpStatus.OK as const

/** In the event that the error status is not
 *  provided or is not in the expected format.
 *
 *  @remark Using IM_A_TEAPOT for now, until I figure out
 *   the best status code to use to cover 'all errors'. */
const FALLBACK_ERROR_STATUS = HttpStatus.IM_A_TEAPOT as const

export const sendMail: bp.IntegrationProps['actions']['sendMail'] = async ({ ctx, input, logger }) => {
  // TODO: Rework the try-catch since it may not be necessary
  try {
    const client = new Resend(ctx.configuration.apiKey)

    const { data, error } = await client.emails.send({
      from: input.from,
      to: input.to,
      subject: input.subject,
      text: input.body,
    })

    const result = parseErrorResponse(error)

    return {
      status: formatStatusCode(result?.status ?? DEFAULT_SUCCESS_STATUS),
      emailId: data?.id ?? null,
      error: result?.error ?? null,
    }
  } catch (thrown: unknown) {
    const error = parseError(thrown)
    logger.forBot().error('Failed to send email', error)
    throw error
  }
}

const parseErrorResponse = (
  errorResp: SendEmailResponse['error'] | null
): { error: Omit<SendEmailResponse['error'], 'statusCode'>; status: number } | null => {
  if (!errorResp) return null

  const { statusCode, ...error } = errorResp
  let status: unknown = statusCode ?? FALLBACK_ERROR_STATUS

  if (typeof statusCode !== 'number') {
    const parsedCode = parseInt(String(statusCode), 10)
    status = !isNaN(parsedCode) ? parsedCode : FALLBACK_ERROR_STATUS
  }

  return {
    status: status as number,
    error,
  }
}
