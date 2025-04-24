import * as sdk from '@botpress/sdk'
import * as crypto from 'crypto'
import * as bp from '.botpress'

export class SlackEventSignatureValidator {
  public constructor(
    private readonly _signingSecret: string,
    private readonly _request: sdk.Request,
    private readonly _logger: bp.Logger
  ) {}

  public isEventProperlyAuthenticated(): boolean {
    return this._areHeadersPresent() && this._isTimestampWithinAcceptableRange() && this._isSignatureValid()
  }

  private _areHeadersPresent(): boolean {
    const timestamp = this._request.headers['x-slack-request-timestamp']
    const slackSignature = this._request.headers['x-slack-signature']

    if (!timestamp || !slackSignature) {
      this._logger.forBot().error('Request signature verification failed: missing timestamp or signature')
      return false
    }

    return true
  }

  private _isTimestampWithinAcceptableRange(): boolean {
    const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5
    const timestamp = this._request.headers['x-slack-request-timestamp'] as string

    if (parseInt(timestamp) < fiveMinutesAgo) {
      this._logger.forBot().error('Request signature verification failed: timestamp is too old')
      return false
    }

    return true
  }

  private _isSignatureValid(): boolean {
    const sigBasestring = `v0:${this._request.headers['x-slack-request-timestamp']}:${this._request.body}`
    const mySignature = 'v0=' + crypto.createHmac('sha256', this._signingSecret).update(sigBasestring).digest('hex')

    try {
      return crypto.timingSafeEqual(
        Buffer.from(mySignature, 'utf8'),
        Buffer.from(this._request.headers['x-slack-signature'] as string, 'utf8')
      )
    } catch {
      this._logger.forBot().error('An error occurred while verifying the request signature')
      return false
    }
  }
}
