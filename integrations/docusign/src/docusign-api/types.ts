export type GetAccessTokenParams =
  | {
      grant_type: 'authorization_code'
      code: string
    }
  | {
      grant_type: 'refresh_token'
      refresh_token: string
    }
