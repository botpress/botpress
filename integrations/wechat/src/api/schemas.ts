import { z } from '@botpress/sdk'

const _wechatErrorRespSchema = z.object({
  errcode: z.coerce.number(),
  errmsg: z.string(),
})

const MISSING_ACCESS_TOKEN_MSG = 'The WeChat access token is missing from the response'
export const weChatAuthTokenRespSchema = z.union([
  _wechatErrorRespSchema,
  z.object({
    access_token: z.string({ required_error: MISSING_ACCESS_TOKEN_MSG }).min(1, MISSING_ACCESS_TOKEN_MSG),
  }),
])

export const wechatSendMessageRespSchema = _wechatErrorRespSchema
  .partial()
  .extend({
    // NOTE: AFAIK the "sendMessage" response doesn't contain
    // any Message ID, because WeChat doesn't send one back.
    // The properties below can likely be safely removed.
    msgid: z.string().optional(),
    msg_id: z.string().optional(),
    message_id: z.string().optional(),
  })
  .transform((data) => ({
    errorCode: data.errcode,
    errorMsg: data.errmsg,
    msgId: data.msgid ?? data.msg_id ?? data.message_id,
  }))
export type WeChatSendMessageResp = z.infer<typeof wechatSendMessageRespSchema>

export const wechatUploadMediaRespSchema = _wechatErrorRespSchema.partial().extend({ media_id: z.string().optional() })
export type WeChatUploadMediaResp = z.infer<typeof wechatUploadMediaRespSchema>

export const wechatVideoUrlRespSchema = _wechatErrorRespSchema.partial().extend({ video_url: z.string().optional() })
export type WeChatVideoUrlResp = z.infer<typeof wechatVideoUrlRespSchema>
