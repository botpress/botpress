import { SendEmailCommand } from '@aws-sdk/client-sesv2'
import { getSesClient } from '../misc/client'
import { CONTACT_LIST, FROM_EMAIL_ADDRESS, EMAIL_SIGNATURE } from '../misc/constants'
import { getErrorMessage } from '../misc/error-handler'
import { escapeHtml } from '../misc/html-utils'
import { addContactToList } from '../utils'
import * as bp from '.botpress'

export const sendMail: bp.IntegrationProps['actions']['sendMail'] = async ({ input, logger, client, ctx }) => {
  const sesClient = getSesClient()

  const header = 'This is a notification from your Botpress bot.'

  const htmlBody = input.isHtml
    ? `<div>
    <p>${escapeHtml(header)}</p>
    ${input.body || ''}
    ${EMAIL_SIGNATURE}
    <p><a href="{{amazonSESUnsubscribeUrl}}">Unsubscribe</a></p>
    </div>`
    : `<div>
    <p>${escapeHtml(header)}</p>
    ${input.body ? `<p>${escapeHtml(input.body).replace(/\r?\n/g, '<br>')}</p>` : ''}
    ${EMAIL_SIGNATURE}
    <p><a href="{{amazonSESUnsubscribeUrl}}">Unsubscribe</a></p>
    </div>`

  const results = {
    successful: [] as { email: string; messageId: string }[],
    failed: [] as { email: string; error: string }[],
  }

  type SendResult =
    | { success: true; email: string; messageId: string }
    | { success: false; email: string; error: string }

  const sendEmailToRecipient = async (email: string): Promise<SendResult> => {
    try {
      await addContactToList(sesClient, email, logger)

      const sendEmailCommand = new SendEmailCommand({
        Destination: {
          ToAddresses: [email], // An unsubscribed email will fail entire operation so emails must be sent individually.
        },
        Content: {
          Simple: {
            Subject: {
              Data: input.subject,
              Charset: 'UTF-8',
            },
            Body: {
              Html: {
                Data: htmlBody,
                Charset: 'UTF-8',
              },
            },
          },
        },
        ListManagementOptions: {
          ContactListName: CONTACT_LIST,
        },
        FromEmailAddress: FROM_EMAIL_ADDRESS,
        ReplyToAddresses: input.replyTo,
      })

      const result = await sesClient.send(sendEmailCommand)

      if (!result.MessageId) {
        return { success: false, email, error: `Failed to send email to ${email}: no MessageId returned` }
      }

      logger.forBot().info(`Email sent successfully to ${email}. Message ID: ${result.MessageId}, botId: ${ctx.botId}`)

      await client.createEvent({
        type: 'emailSent',
        payload: {
          messageId: result.MessageId,
          to: [email],
          subject: input.subject,
          fromEmail: FROM_EMAIL_ADDRESS,
          timestamp: new Date().toISOString(),
        },
      })

      return { success: true, email, messageId: result.MessageId }
    } catch (error) {
      logger.forBot().warn(`Failed to send email to ${email}: ${getErrorMessage(error)}`)
      return { success: false, email, error: getErrorMessage(error) }
    }
  }

  const emailResults = await Promise.all(input.to.map((email) => sendEmailToRecipient(email)))

  for (const result of emailResults) {
    if (result.success) {
      results.successful.push({ email: result.email, messageId: result.messageId })
    } else {
      results.failed.push({ email: result.email, error: result.error })
    }
  }

  logger
    .forBot()
    .info(`Email sending completed. Successful: ${results.successful.length}, Failed: ${results.failed.length}`)

  return results
}
