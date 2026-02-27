import * as bp from '.botpress'
import { addContactToList } from '../utils'
import { SendEmailCommand } from '@aws-sdk/client-sesv2'
import * as sdk from '@botpress/sdk'
import { getSesClient } from '../misc/client'
import { CONTACT_LIST, FROM_EMAIL_ADDRESS, EMAIL_SIGNATURE } from '../misc/constants'
import { getErrorMessage } from '../misc/error-handler'
import { Output } from '.botpress/implementation/typings/actions/sendMail/output'

export const sendMail: bp.IntegrationProps['actions']['sendMail'] = async ({ input, logger, client, ctx }) => {
  try {
    const SESClient = getSesClient()

    const header = 'This is a notification from your Botpress bot.'

    const htmlBody = input.isHtml
      ? `<div>
    <p>${header}</p>
    ${input.body || ''}
    ${EMAIL_SIGNATURE}
    <p><a href="{{amazonSESUnsubscribeUrl}}">Unsubscribe</a></p>
    </div>`
      : `<div>
    <p>${header}</p>
    ${input.body ? `<p>${input.body.replace(/\r?\n/g, '<br>')}</p>` : ''}
    ${EMAIL_SIGNATURE}
    <p><a href="{{amazonSESUnsubscribeUrl}}">Unsubscribe</a></p>
    </div>`

    const results: Output = {
      successful: [],
      failed: [],
    }

    const sendEmailToRecipient = async (email: string) => {
      try {
        await addContactToList(email)

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

        const result = await SESClient.send(sendEmailCommand)

        if (!result.MessageId) {
          throw new sdk.RuntimeError(`Failed to send email to ${email}`)
        }

        logger
          .forBot()
          .info(`Email sent successfully to ${email}. Message ID: ${result.MessageId}, botId: ${ctx.botId}`)

        await client.createEvent({
          type: 'emailSent',
          payload: {
            messageId: result.MessageId!,
            to: [email],
            subject: input.subject,
            fromEmail: FROM_EMAIL_ADDRESS,
            timestamp: new Date().toISOString(),
          },
        })

        return {
          email,
          messageId: result.MessageId,
        }
      } catch (error) {
        logger.forBot().warn(`Failed to send email to ${email}: ${getErrorMessage(error)}`)

        throw {
          email,
          error: getErrorMessage(error),
        }
      }
    }

    const emailPromises = input.to.map((email) => sendEmailToRecipient(email))
    const emailResults = await Promise.allSettled(emailPromises)

    emailResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.successful.push(result.value)
      } else {
        results.failed.push(result.reason)
      }
    })

    logger
      .forBot()
      .info(`Email sending completed. Successful: ${results.successful.length}, Failed: ${results.failed.length}`)

    return results
  } catch (error) {
    logger.forBot().error(`Failed to send email: ${getErrorMessage(error)}`)
    throw new sdk.RuntimeError(`Failed to send email: ${getErrorMessage(error)}`)
  }
}
