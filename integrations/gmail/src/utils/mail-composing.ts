import MailComposer from 'nodemailer/lib/mail-composer'
import type Mail from 'nodemailer/lib/mailer'
import { encodeBase64URL } from './string-utils'

export const composeRawEmail = async (options: Mail.Options) => {
  const mailComposer = new MailComposer(options)
  const message = await mailComposer.compile().build()
  return encodeBase64URL(message)
}
