import z from 'zod'

export const targets = z.object({
  dm: z.record(z.string()).optional(),
  channel: z.record(z.string()).optional(),
  thread: z.record(z.string()).optional(),
})
