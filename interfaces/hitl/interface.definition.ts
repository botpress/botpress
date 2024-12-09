/* bplint-disable */
import { z, AnyZodObject, messages, InterfaceDefinition } from '@botpress/sdk'

const withUserId = <S extends z.AnyZodObject>(s: { schema: S }) => ({
  ...s,
  schema: () =>
    s.schema.extend({
      userId: z.string().optional().describe('Allows sending a message pretending to be a certain user'),
    }),
})

const messageSourceSchema = z.union([
  z.object({ type: z.literal('user'), userId: z.string() }),
  z.object({ type: z.literal('bot') }),
])

const allMessages = {
  ...messages.defaults,
  markdown: messages.markdown,
} satisfies Record<string, { schema: AnyZodObject }>

type Tuple<T> = [T, T, ...T[]]
const messagePayloadSchemas: AnyZodObject[] = Object.entries(allMessages).map(([k, v]) =>
  z.object({
    source: messageSourceSchema,
    type: z.literal(k),
    payload: v.schema,
  })
)

const messageSchema = z.union(messagePayloadSchemas as Tuple<AnyZodObject>)

export default new InterfaceDefinition({
  name: 'hitl',
  version: '0.4.0',
  entities: {},
  events: {
    hitlAssigned: {
      schema: () =>
        z.object({
          conversationId: z.string(),
          userId: z.string(),
        }),
    },
    hitlStopped: {
      schema: () =>
        z.object({
          conversationId: z.string(),
        }),
    },
  },
  actions: {
    // TODO: allow for an interface to extend 'proactiveUser' and reuse its actions
    createUser: {
      input: {
        schema: () =>
          z.object({
            name: z.string().optional(),
            pictureUrl: z.string().optional(),
            email: z.string().optional(),
          }),
      },
      output: {
        schema: () =>
          z.object({
            userId: z.string(),
          }),
      },
    },
    startHitl: {
      input: {
        schema: () =>
          z.object({
            userId: z.string(),
            title: z.string(),
            description: z.string().optional(),
            messageHistory: z
              .array(messageSchema)
              .optional()
              .describe('Message history to display in the HITL session'),
          }),
      },
      output: {
        schema: () =>
          z.object({
            conversationId: z.string(),
          }),
      },
    },
    stopHitl: {
      input: {
        schema: () =>
          z.object({
            conversationId: z.string(),
            reason: z.enum(['timeout', 'cancel']).optional(),
          }),
      },
      output: {
        schema: () => z.object({}),
      },
    },
  },
  channels: {
    hitl: {
      messages: {
        text: withUserId(messages.defaults.text),
      },
    },
  },
})
