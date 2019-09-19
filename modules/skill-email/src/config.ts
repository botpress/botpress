export interface Config {
  /**
   * Nodemailer2 transport connection string
   * @see https://www.npmjs.com/package/nodemailer2
   * @example smtps://user%40gmail.com:pass@smtp.gmail.com
   * @default <<change me>>
   */
  transportConnectionString: string
}
