export interface Config {
  /**
   * The email of the service account used to authenticate with Google APIs
   * @default "your client email here"
   */
  clientEmail: string
  /**
   * The private key linked with the service account used to authenticate with Google APIs
   * @default "your private key here"
   */
  privateKey: string
}
