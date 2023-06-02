import { RuntimeError } from '@botpress/client'
import { z } from 'zod'

// simply used to build the schema
const e = new RuntimeError('')

export const runtimeErrorSchema = z.object({
  code: z.literal(e.code),
  type: z.literal(e.type),
  message: z.string(),
})
