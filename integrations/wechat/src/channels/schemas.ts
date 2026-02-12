import { z } from '@botpress/sdk'
import { Merge } from '../types'

export const wechatMessageSchema = z.object({
  msgId: z.string(), // TBD if this is always present (aka min length 1), will confirm in QA
  msgType: z.string().min(1),
  toUserName: z.string().min(1),
  fromUserName: z.string().min(1),
  content: z.string().optional(),
  picUrl: z.string().optional(),
  mediaId: z.string().optional(),
  recognition: z.string().optional(),
  locationX: z.string().optional(),
  locationY: z.string().optional(),
  label: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  url: z.string().optional(),
  dateCreated: z.string().min(1),
})
export type WeChatMessage = z.infer<typeof wechatMessageSchema>
export type WeChatMediaMessage = Merge<WeChatMessage, { msgType: 'image' | 'video' }>
