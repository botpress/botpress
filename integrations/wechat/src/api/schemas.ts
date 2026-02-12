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

export const wechatSendMessageResponseSchema = z
  .object({
    errcode: z.number().optional(),
    errmsg: z.string().optional(),
    // Not sure which one of these "message ids" is the correct key, so I've copied it from the previous implementation.
    // My suspicion is that it will vary based on which message type I use in the request. (To be tested)
    msgid: z.string().optional(),
    msg_id: z.string().optional(),
    message_id: z.string().optional(),
  })
  .transform((data) => ({
    errorCode: data.errcode,
    errorMsg: data.errmsg,
    msgId: data.msgid ?? data.msg_id ?? data.message_id,
  }))
export type WeChatSendMessageResponse = z.infer<typeof wechatSendMessageResponseSchema>
