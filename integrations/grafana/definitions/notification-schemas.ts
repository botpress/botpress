import { z } from '@botpress/sdk'

export const matcherSchema = z.object({
  name: z.string(),
  operator: z.enum(['=', '!=', '=~', '!~']),
  value: z.string(),
})

export const notificationPolicySchema = z.object({
  receiver: z.string().min(1, 'Contact point name is required'),
  matchers: z.array(matcherSchema).optional().describe('Label matchers to route alerts to this policy'),
  continue: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to continue matching other policies after this one matches'),
  group_by: z.array(z.string()).optional(),
  group_wait: z.string().optional(),
  group_interval: z.string().optional(),
  repeat_interval: z.string().optional(),
  mute_time_intervals: z.array(z.string()).optional(),
  active_time_intervals: z.array(z.string()).optional(),
})
