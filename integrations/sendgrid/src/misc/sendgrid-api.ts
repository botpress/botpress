import sgClient from '@sendgrid/client'
import sgMail, { MailDataRequired } from '@sendgrid/mail'

/** A class for making http requests to the SendGrid API
 *
 *  @remark Always use this class over importing the client from either "@sendgrid/client" or "@sendgrid/mail".
 *   Otherwise, intermittent API key failures will occur. */
export class SendGridClient {
  private _apiKey: string

  public constructor(apiKey: string) {
    this._apiKey = apiKey
  }

  private get _requestClient() {
    sgClient.setApiKey(this._apiKey)
    return sgClient
  }

  private get _mailClient() {
    sgMail.setClient(this._requestClient)
    return sgMail
  }

  public async getPermissionScopes() {
    const [response] = await this._requestClient.request({
      method: 'GET',
      url: '/v3/scopes',
    })
    return response
  }

  public async sendMail(data: MailDataRequired) {
    const [response] = await this._mailClient.send(data)
    return response
  }
}
