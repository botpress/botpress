import SMTPConnection from 'nodemailer/lib/smtp-connection'

export interface Config {
  /**
   * @default builtin_single-choice
   */
  defaultContentElement: string
  /**
   * @default #builtin_single-choice
   */
  defaultContentRenderer: string
  /**
   * @default 3
   */
  defaultMaxAttempts: number
  /**
   * @default true
   */
  disableIntegrityCheck: boolean
  /**
   * @default true
   */
  matchNumbers: boolean
  /**
   * @default true
   */
  matchNLU: boolean
  /**
   * Nodemailer2 transport connection string.
   * @see https://www.npmjs.com/package/nodemailer2
   *
   * Alternatively, you can pass an object with any required parameters
   * @see https://nodemailer.com/smtp/#examples
   *
   * @example smtps://user%40gmail.com:pass@smtp.gmail.com
   * @default <<change me>>
   */
  transportConnectionString: string | SMTPConnection
}
