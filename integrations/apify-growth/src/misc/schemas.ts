import { z } from 'zod'

export const apifyWebhookSchema = z.object({
  userId: z.string(),
  createdAt: z.string(),
  eventType: z.string(),
  eventData: z.object({
    actorId: z.string(),
    actorRunId: z.string(),
  }),
  resource: z
    .object({
      id: z.string(),
      actId: z.string(),
      userId: z.string(),
      startedAt: z.string().nullable().optional(),
      finishedAt: z.string().nullable().optional(),
      status: z.string(),
      statusMessage: z.string().nullable().optional(),
      isStatusMessageTerminal: z.boolean().nullable().optional(),
      meta: z
        .object({
          origin: z.string(),
          userAgent: z.string(),
        })
        .optional(),
      stats: z
        .object({
          inputBodyLen: z.number(),
          durationMillis: z.number(),
          runTimeSecs: z.number(),
          computeUnits: z.number(),
          memAvgBytes: z.number(),
          memMaxBytes: z.number(),
          cpuAvgUsage: z.number(),
          netRxBytes: z.number(),
          netTxBytes: z.number(),
        })
        .passthrough()
        .optional(), // Allow additional stats fields and make optional
      options: z
        .object({
          build: z.string(),
          timeoutSecs: z.number(),
          memoryMbytes: z.number(),
          diskMbytes: z.number(),
        })
        .optional(),
      buildId: z.string().optional(),
      exitCode: z.number().optional(),
      defaultKeyValueStoreId: z.string().optional(),
      defaultDatasetId: z.string().optional(),
      defaultRequestQueueId: z.string().optional(),
      platformUsageBillingModel: z.string().optional(),
      generalAccess: z.string().optional(),
      buildNumber: z.any().optional(),
      containerUrl: z.string().optional(),
      usage: z.record(z.number()).optional(),
      usageTotalUsd: z.number().optional(),
      usageUsd: z.record(z.number()).optional(),
      links: z
        .object({
          publicRunUrl: z.string(),
          consoleRunUrl: z.string(),
          apiRunUrl: z.string(),
        })
        .optional(),
    })
    .passthrough(), // Allow additional resource fields
})
