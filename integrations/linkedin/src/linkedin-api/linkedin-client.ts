import * as sdk from '@botpress/sdk'
import { LinkedInOAuthClient, formatLinkedInError } from './linkedin-oauth-client'
import * as bp from '.botpress'

const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo'

type UserInfo = {
  sub: string
  name?: string
  given_name?: string
  family_name?: string
  picture?: string
  email?: string
  email_verified?: boolean
}

export class LinkedInClient {
  private _accessToken: string

  private constructor(accessToken: string) {
    this._accessToken = accessToken
  }

  /**
   * Create a LinkedIn client from stored credentials.
   * Both OAuth and manual configurations store tokens in state after initial setup.
   */
  public static async create({ client, ctx }: { client: bp.Client; ctx: bp.Context }): Promise<LinkedInClient> {
    const oauthClient = await LinkedInOAuthClient.createFromState({ client, ctx })
    const accessToken = await oauthClient.getAccessToken()

    return new LinkedInClient(accessToken)
  }

  public async getMyProfile(): Promise<UserInfo> {
    const response = await fetch(LINKEDIN_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${this._accessToken}`,
      },
    })

    if (!response.ok) {
      const errorMsg = await formatLinkedInError(response, 'Failed to fetch LinkedIn profile')
      throw new sdk.RuntimeError(errorMsg)
    }

    return (await response.json()) as UserInfo
  }

  public async verifyCredentials(): Promise<boolean> {
    try {
      await this.getMyProfile()
      return true
    } catch {
      return false
    }
  }
}
