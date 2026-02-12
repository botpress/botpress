import { z } from '@botpress/sdk'

const MISSING_ACCESS_TOKEN_MSG = 'The WeChat access token is missing from the response'
export const weChatAuthTokenResponseSchema = z.union([
  z.object({
    errcode: z.number(),
    errmsg: z.string(),
  }),
  z.object({
    access_token: z.string({ required_error: MISSING_ACCESS_TOKEN_MSG }).min(1, MISSING_ACCESS_TOKEN_MSG),
  }),
])
