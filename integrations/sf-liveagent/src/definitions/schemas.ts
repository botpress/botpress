import { z } from 'zod'

export const AxiosBasicCredentialsSchema = z.object({
  username: z.string(),
  password: z.string(),
})

export const AxiosProxyConfigSchema = z.object({
  host: z.string(),
  port: z.number(),
  auth: AxiosBasicCredentialsSchema.optional(),
  protocol: z.string().optional(),
})

export const SFLiveagentConfigSchema = z
  .object({
    endpoint: z.string({
      invalid_type_error: 'Endpoint must be a string',
      required_error:
        'Saleforce endpoint is required, example: https://something.salesforceliveagent.com/chat',
    }),
    organizationId: z.string(),
    deploymentId: z.string(),
    liveAgentId: z.string().optional(),
    buttonId: z.string(),
    waitAgentTimeout: z.string().default('10s'),
    messageHistory: z.array(z.string()).default([]),
    chatHistoryMessageCount: z.number().default(10),
    apiVersion: z.number().default(34),
    useProxy: z.boolean().default(false),
    proxy: AxiosProxyConfigSchema.optional(),
  })

export type SFLiveagentConfig = z.infer<typeof SFLiveagentConfigSchema>

export const ChasitorSessionSchema = z
  .object({
    affinityToken: z.string(),
    sessionKey: z.string(),
    sessionId: z.string()
  })

export type ChasitorSession = z.infer<typeof ChasitorSessionSchema>

export const PollingSessionSchema = z
  .object({
    pollingKey: z.string().optional()
  })

export type PollingSession = z.infer<typeof PollingSessionSchema>

export const LiveAgentSessionSchema = ChasitorSessionSchema.merge(PollingSessionSchema)

export type LiveAgentSession = z.infer<typeof LiveAgentSessionSchema>

export const CreateSessionResponseSchema = z
  .object({
    key: z.string(),
    id: z.string(),
    clientPollTimeout: z.number(),
    affinityToken: z.string()
  })

export type CreateSessionResponse = z.output<typeof CreateSessionResponseSchema>

export const CreatePollingResponseSchema = z
  .object({
    success: z.boolean(),
    data: z.object({
      key: z.string()
    })
  })

export type CreatePollingResponse = z.output<typeof CreatePollingResponseSchema>

export const ConversationSchema = z
  .object({
    id: z.string(),
  })
