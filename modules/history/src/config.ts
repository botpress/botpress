export interface Config {
  /**
   * Time to live of a database entry before it is deleted or 'never'
   * @default 60 days
   */
  dataRetention: string
}
