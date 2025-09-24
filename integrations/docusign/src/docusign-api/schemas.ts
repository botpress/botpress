import { z } from '@botpress/sdk'

export const docusignOAuthAccessTokenRespSchema = z.object({
  access_token: z.string(),
  token_type: z.string().describe('The authentication header type (e.g. "Bearer")'),
  expires_in: z.number().describe('Seconds until the token expires'),
  refresh_token: z.string(),
  scope: z.string(),
})

export type GetAccessTokenResp = {
  accessToken: string
  /** The authentication header type for the access token (e.g. "Bearer") */
  tokenType: string
  /** The expiry time of the access token represented as a Unix timestamp (milliseconds) */
  expiresAt: number
  refreshToken: string
}

const _userAccountSchema = z
  .object({
    account_id: z.string(),
    account_name: z.string(),
    is_default: z.boolean(),
    base_uri: z.string().url(),
  })
  .strip()
export type UserAccount = z.infer<typeof _userAccountSchema>

export const getUserInfoRespSchema = z
  .object({
    sub: z.string().min(1),
    accounts: z.array(_userAccountSchema).min(1),
  })
  .strip()
export type GetUserInfoResp = z.infer<typeof getUserInfoRespSchema>
