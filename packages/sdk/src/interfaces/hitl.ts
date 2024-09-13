import { InterfaceDeclaration } from '../integration'
import * as messages from '../message'
import z, { ZodTypeAny } from '../zui'

const withUserId = <S extends z.AnyZodObject>(s: { schema: S }) => ({
  ...s,
  schema: () =>
    s.schema.extend({
      userId: z.string().optional().describe('Allows sending a message pretending to be a certain user'),
    }),
})

type Tuple<T> = [T, T, ...T[]]
const messagePayloadSchemas: ZodTypeAny[] = Object.values(messages.defaults).map((d) => d.schema)
const messageSchema = z.object({
  userId: z.string(),
  type: z.enum(Object.keys(messages.defaults) as Tuple<string>),
  payload: z.union(messagePayloadSchemas as Tuple<ZodTypeAny>),
})

export const hitl = new InterfaceDeclaration({
  name: 'hitl',
  version: '0.3.0',
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
            messageHistory: z.array(messageSchema).optional(),
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
