import nodemailer from 'nodemailer'
import * as bp from '.botpress'

export const sendNodemailerMail = async (
  config: { user: string; password: string },
  props: bp.actions.sendEmail.input.Input
) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
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
