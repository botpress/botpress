import { z } from '@botpress/sdk'

export const matcherSchema = z.object({
  name: z.string().title('Label Name').describe('Label name to match'),
  operator: z
    .enum(['=', '!=', '=~', '!~'])
    .title('Operator')
    .describe('Match operator: = equals, != not equals, =~ regex match, !~ regex no match'),
  value: z.string().title('Value').describe('Label value or regex pattern to match against'),
})

export const notificationPolicySchema = z.object({
  receiver: z
    .string()
    .min(1, 'Contact point name is required')
    .title('Receiver')
    .describe('Name of the contact point to route matching alerts to'),
  matchers: z
    .array(matcherSchema)
    .optional()
    .title('Matchers')
    .describe('Label matchers to route alerts to this policy'),
  continue: z
    .boolean()
    .optional()
    .default(true)
    .title('Continue')
    .describe('Whether to continue matching other policies after this one matches'),
  group_by: z
    .array(z.string())
    .optional()
    .title('Group By')
    .describe('Labels to group alerts by when sending notifications'),
  group_wait: z
    .string()
    .optional()
    .title('Group Wait')
    .describe('Time to wait before sending the first notification for a new alert group (e.g. "30s")'),
  group_interval: z
    .string()
    .optional()
    .title('Group Interval')
    .describe('Interval between notifications for ongoing alert groups (e.g. "5m")'),
  repeat_interval: z
    .string()
    .optional()
    .title('Repeat Interval')
    .describe('Interval before re-sending a notification for an ongoing alert (e.g. "4h")'),
  mute_time_intervals: z
    .array(z.string())
    .optional()
    .title('Mute Time Intervals')
    .describe('Named time intervals during which notifications are muted'),
  active_time_intervals: z
    .array(z.string())
    .optional()
    .title('Active Time Intervals')
    .describe('Named time intervals during which this policy is active'),
})
