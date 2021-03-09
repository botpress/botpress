import SMTPConnection from 'nodemailer/lib/smtp-connection'

export interface Config {
  /**
   * @description Default content renderer when displaying choices
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
   * @name Match Numbers
   * @title fuck bitch
   * @description When true, it will try to extract numbers from questions
   * @ui:title fuck bitch
   * @ui:description: When true, it will try to extract numbers from questions
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
