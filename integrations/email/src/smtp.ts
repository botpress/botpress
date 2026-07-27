import * as sdk from '@botpress/sdk'
import nodemailer from 'nodemailer'
import * as bp from '.botpress'

export const sendNodemailerMail = async (
  config: bp.Context['configuration'],
  props: bp.actions.sendEmail.input.Input,
  logger: bp.Logger
) => {
  let transporter: nodemailer.Transporter
  try {
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      auth: {
        user: config.user,
        pass: config.password,
      },
    })
  } catch (thrown: unknown) {
    const err = thrown instanceof Error ? thrown : new Error(`${thrown}`)
    throw new sdk.RuntimeError(`Failed to create SMTP transport: ${err.message}. Verify your SMTP configuration.`)
  }

  try {
    await transporter.sendMail({
      from: config.user,
      ...props,
      references: props.inReplyTo,
    })
  } catch (thrown: unknown) {
    const err = thrown instanceof Error ? thrown : new Error(`${thrown}`)
    throw new sdk.RuntimeError(`Failed to send email to '${props.to}': ${err.message}`)
  }

  logger.forBot().info(`Sent email with subject '${props.subject}' via SMTP`)
  return {}
}
