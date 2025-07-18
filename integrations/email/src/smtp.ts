import nodemailer from 'nodemailer'
import * as bp from '.botpress'

export const sendNodemailerMail = async (
  config: bp.Context['configuration'],
  props: bp.actions.sendEmail.input.Input
) => {
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    auth: {
      user: config.user,
      pass: config.password,
    },
  })

  await transporter.sendMail({
    from: config.user,
    ...props,
  })
  return { message: 'Success' }
}
