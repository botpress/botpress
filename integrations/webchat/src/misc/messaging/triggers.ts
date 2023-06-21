import { z } from 'zod'

export const webchatVisibility = z.object({
  type: z.literal('webchat-visibility'),
  visibility: z.union([z.literal('show'), z.literal('hide'), z.literal('toggle')]),
})

export const webchatConfig = z.object({
  type: z.literal('webchat-config'),
  config: z.record(z.any()),
})

export const customEvent = z.object({
  type: z.literal('custom-event'),
  event: z.record(z.any()),
})

export const triggerSchema = z.union([webchatVisibility, webchatConfig, customEvent])
