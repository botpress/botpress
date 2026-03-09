import { z } from '@botpress/sdk'
import { Merge } from '../types'

const MS_PER_SECOND = 1000

export const wechatMessageSchema = z
  .object({
    msgId: z.string().min(1),
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
    createTime: z.coerce.number().positive().describe('Seconds since UTC Epoch'),
  })
  .passthrough()
  .transform(({ createTime, ...data }) => ({
    ...data,
    dateCreated: new Date(createTime * MS_PER_SECOND),
  }))
export type WeChatMessage = z.infer<typeof wechatMessageSchema>
export type WeChatMediaMessage = Merge<WeChatMessage, { msgType: 'image' | 'video' }>
