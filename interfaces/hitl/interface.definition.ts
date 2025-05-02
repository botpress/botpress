import * as sdk from '@botpress/sdk'

type AnyMessageType = (typeof sdk.messages.defaults)[keyof typeof sdk.messages.defaults]
const withUserId = (s: AnyMessageType) => ({
  ...s,
  schema: () =>
    s.schema.extend({
      userId: sdk.z.string().optional().describe('Allows sending a message pretending to be a certain user'),
    }),
})

const messageSourceSchema = sdk.z.union([
  sdk.z.object({ type: sdk.z.literal('user'), userId: sdk.z.string() }),
  sdk.z.object({ type: sdk.z.literal('bot') }),
])

const allMessages = {
  ...sdk.messages.defaults,
  markdown: sdk.messages.markdown,
} satisfies Record<string, { schema: sdk.AnyZodObject }>

type Tuple<T> = [T, T, ...T[]]
const messagePayloadSchemas: sdk.AnyZodObject[] = Object.entries(allMessages).map(([k, v]) =>
  sdk.z.object({
    source: messageSourceSchema,
    type: sdk.z.literal(k),
    payload: v.schema,
  })
)

const messageSchema = sdk.z.union(messagePayloadSchemas as Tuple<sdk.AnyZodObject>)

export default new sdk.InterfaceDefinition({
  name: 'hitl',
  version: '1.1.2',
  entities: {},
  events: {
    hitlAssigned: {
      schema: () =>
        sdk.z.object({
          // Also known as downstreamConversationId:
          conversationId: sdk.z
            .string()
            .title('HITL session ID')
            .describe('ID of the Botpress conversation representing the HITL session'),

          // Also known as humanAgentUserId:
          userId: sdk.z
            .string()
            .title('Human agent user ID')
            .describe('ID of the Botpress user representing the human agent assigned to the HITL session'),
        }),
    },
    hitlStopped: {
      schema: () =>
        sdk.z.object({
          // Also known as downstreamConversationId:
          conversationId: sdk.z
            .string()
            .title('HITL session ID')
            .describe('ID of the Botpress conversation representing the HITL session'),
        }),
    },
  },
  actions: {
    // TODO: allow for an interface to extend 'proactiveUser' and reuse its actions
    createUser: {
      attributes: {
        ...sdk.WELL_KNOWN_ATTRIBUTES.HIDDEN_IN_STUDIO,
      },
      title: 'Create external user', // <= this is a downstream user
      description: 'Create an end user in the external service and in Botpress',
      input: {
        schema: () =>
          sdk.z.object({
            name: sdk.z.string().title('Display name').describe('Display name of the end user'),
            pictureUrl: sdk.z.string().title('Picture URL').describe("URL of the end user's avatar").optional(),
            email: sdk.z.string().title('Email address').describe('Email address of the end user').optional(),
          }),
      },
      output: {
        schema: () =>
          sdk.z.object({
            userId: sdk.z
              .string()
              .title('Botpress user ID')
              .describe('ID of the Botpress user representing the end user'),
          }),
      },
    },
    startHitl: {
      attributes: {
        ...sdk.WELL_KNOWN_ATTRIBUTES.HIDDEN_IN_STUDIO,
      },
      title: 'Start new HITL session', // <= this is a downstream conversation / ticket
      description: 'Create a new HITL session in the external service and in Botpress',
      input: {
        schema: () =>
          sdk.z.object({
            // Also known as downstreamUserId:
            userId: sdk.z.string().title('User ID').describe('ID of the Botpress user representing the end user'),

            // Ticket title:
            title: sdk.z
              .string()
              .title('Title')
              .describe('Title of the HITL session. This corresponds to a ticket title in systems that use tickets.')
              .optional(),

            // Ticket description:
            description: sdk.z
              .string()
              .title('Description')
              .describe(
                'Description of the HITL session. This corresponds to a ticket description in systems that use tickets.'
              )
              .optional(),

            // All messages sent prior to HITL session creation:
            messageHistory: sdk.z
              .array(messageSchema)
              .title('Conversation history')
              .describe(
                'History of all messages in the conversation up to this point. Should be displayed to the human agent in the external service.'
              ),
          }),
      },
      output: {
        schema: () =>
          sdk.z.object({
            // Also known as downstreamConversationId:
            conversationId: sdk.z
              .string()
              .title('HITL session ID')
              .describe('ID of the Botpress conversation representing the HITL session'),
          }),
      },
    },
    stopHitl: {
      attributes: {
        ...sdk.WELL_KNOWN_ATTRIBUTES.HIDDEN_IN_STUDIO,
      },
      title: 'Stop HITL session',
      description: 'Stop an existing HITL session in the external service',
      input: {
        schema: () =>
          sdk.z.object({
            // Also known as downstreamConversationId:
            conversationId: sdk.z
              .string()
              .title('HITL session ID')
              .describe('ID of the Botpress conversation representing the HITL session'),
          }),
      },
      output: {
        schema: () => sdk.z.object({}),
      },
    },
  },
  channels: {
    hitl: {
      messages: {
        text: withUserId(sdk.messages.defaults.text),
        image: withUserId(sdk.messages.defaults.image),
        audio: withUserId(sdk.messages.defaults.audio),
        video: withUserId(sdk.messages.defaults.video),
        file: withUserId(sdk.messages.defaults.file),
        bloc: withUserId(sdk.messages.defaults.bloc),
      },
    },
  },
})
