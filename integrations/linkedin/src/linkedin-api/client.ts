import { PostsApi } from './apis'
import { LinkedInOAuthClient } from './linkedin-oauth-client'
import * as bp from '.botpress'

export class LinkedInClient {
  public readonly posts: PostsApi
  public readonly authorUrn: string

  private constructor(accessToken: string, userId: string, logger: bp.Logger) {
    this.posts = new PostsApi(accessToken, logger)
    this.authorUrn = `urn:li:person:${userId}`
  }

  public static async create({
    client,
    ctx,
    logger,
  }: {
    client: bp.Client
    ctx: bp.Context
    logger: bp.Logger
  }): Promise<LinkedInClient> {
    const oauthClient = await LinkedInOAuthClient.createFromState({ client, ctx, logger })
    const accessToken = await oauthClient.getAccessToken()
    const userId = oauthClient.getUserId()

    return new LinkedInClient(accessToken, userId, logger)
  }
}
