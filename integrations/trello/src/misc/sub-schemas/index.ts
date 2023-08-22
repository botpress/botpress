import z from 'zod'

const TrelloIDSchema = z.string().nullable()

const LimitsObjectSchema = z.object({
  status: z.string().optional().nullable(),
  disableAt: z.number().optional().nullable(),
  warnAt: z.number().optional().nullable(),
})

const MemberPrefsSchema = z.object({
  timezoneInfo: z
    .object({
      offsetCurrent: z.number().optional().nullable(),
      timezoneCurrent: z.string().optional().nullable(),
      offsetNext: z.number().optional().nullable(),
      dateNext: z.string().optional().nullable(),
      timezoneNext: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),

  privacy: z
    .object({
      fullName: z.string().optional().nullable(),
      avatar: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),

  sendSummaries: z.boolean().optional().nullable(),
  minutesBetweenSummaries: z.number().optional().nullable(),
  minutesBeforeDeadlineToNotify: z.number().optional().nullable(),

  colorBlind: z.boolean().optional().nullable(),
  locale: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),

  twoFactor: z
    .object({
      enabled: z.boolean().optional().nullable(),
      needsNewBackups: z.boolean().optional().nullable(),
    })
    .optional()
    .nullable(),
})

export { TrelloIDSchema, LimitsObjectSchema, MemberPrefsSchema }
