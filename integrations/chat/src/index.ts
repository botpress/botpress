import * as dynamodb from '@aws-sdk/client-dynamodb'
import { makeApiUtils } from './api-utils'
import { AuthKeyHandler } from './auth-key'
import * as debug from './debug'
import { makeHandler } from './handler'
import { MemorySpace, ChatIdStore, InMemoryChatIdStore, DynamoDbChatIdStore } from './id-store'
import { Options, options } from './options'
import {
  CompositeSignalEmiter,
  PushpinEmitter,
  SignalEmitter,
  WebhookEmitter,
  MessageCreatedSignal,
} from './signal-emitter'
import { MessageArgs, ActionArgs } from './types'
import * as bp from '.botpress'

const memSpace = new MemorySpace()

type ChatIdStores = Record<'convIdStore' | 'userIdStore', ChatIdStore>
const makeIdStores = (options: Options): ChatIdStores => {
  if (options.fidStore.strategy === 'dynamo-db') {
    const { botId } = options
    const { endpoint, region, accessKeyId, secretAccessKey, conversationTable, userTable } = options.fidStore

    const client = new dynamodb.DynamoDBClient({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })

    return {
      convIdStore: new DynamoDbChatIdStore(client, { botId, ...conversationTable }),
      userIdStore: new DynamoDbChatIdStore(client, { botId, ...userTable }),
    }
  }

  return {
    convIdStore: new InMemoryChatIdStore(memSpace.subSpace('conversation')),
    userIdStore: new InMemoryChatIdStore(memSpace.subSpace('user')),
  }
}

const makeEmitter = (options: Options): SignalEmitter => {
  const { signalUrl, signalSecret, webhookUrl, webhookSecret } = options

  const pushpinEmitter = new PushpinEmitter(signalUrl, signalSecret)
  if (!webhookUrl) {
    return pushpinEmitter
  }

  const webhookEmitter = new WebhookEmitter(webhookUrl, webhookSecret)
  return new CompositeSignalEmiter([pushpinEmitter, webhookEmitter])
}

const messageToSignal = (args: MessageArgs): MessageCreatedSignal['data']['payload'] => {
  const { type } = args
  const { metadata: _, ...payload } = args.payload
  return {
    type,
    ...payload,
  } as MessageCreatedSignal['data']['payload']
}

const mapMessageSignalFid = async (idStores: ChatIdStores, args: MessageArgs): Promise<MessageArgs> => {
  const conversationId = await idStores.convIdStore.byId.get(args.conversation.id)
  const userId = await idStores.userIdStore.byId.get(args.user.id)
  return {
    ...args,
    message: {
      ...args.message,
      conversationId,
      userId,
    },
    conversation: {
      ...args.conversation,
      id: conversationId,
    },
    user: {
      ...args.user,
      id: userId,
    },
  }
}

const mapEventSignalFid = async (idStores: ChatIdStores, args: ActionArgs): Promise<ActionArgs> => {
  const { input } = args
  const conversationId = await idStores.convIdStore.byId.get(input.conversationId)
  return {
    ...args,
    input: {
      ...input,
      conversationId,
    },
  }
}

const emitMessage = async (args: MessageArgs) => {
  const opts = options(args)
  const signalEmitter = makeEmitter(opts)
  const idStores = makeIdStores(opts)

  const {
    conversation: { id: channel },
  } = args

  args = await mapMessageSignalFid(idStores, args)
  debug.debugSignal(args)

  await signalEmitter.emit(channel, {
    type: 'message_created',
    data: {
      id: args.message.id,
      conversationId: args.conversation.id,
      userId: args.user.id,
      createdAt: args.message.createdAt,
      payload: messageToSignal(args),
      metadata: args.payload.metadata,
      isBot: true,
    },
  })
}

const emitEvent = async (args: ActionArgs) => {
  const opts = options(args)
  const signalEmitter = makeEmitter(opts)
  const idStores = makeIdStores(opts)

  const {
    input: { conversationId: channel },
  } = args

  args = await mapEventSignalFid(idStores, args)
  debug.debugSignal(args)

  await signalEmitter.emit(channel, {
    type: 'event_created',
    data: {
      id: null,
      createdAt: new Date().toISOString(),
      conversationId: args.input.conversationId,
      userId: args.ctx.botUserId,
      payload: args.input.payload,
      isBot: true,
    },
  })
}

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    sendEvent: async (props) => {
      await emitEvent(props)
      return {}
    },
  },
  channels: {
    channel: {
      messages: {
        text: emitMessage,
        markdown: emitMessage,
        image: emitMessage,
        audio: emitMessage,
        video: emitMessage,
        file: emitMessage,
        location: emitMessage,
        carousel: emitMessage,
        card: emitMessage,
        dropdown: emitMessage,
        choice: emitMessage,
        bloc: emitMessage,
      },
    },
  },
  handler: async (props) => {
    const opts = options(props)

    const signalEmitter = makeEmitter(opts)
    const auth = new AuthKeyHandler(opts.encryptionKey, opts.encryptionMode)
    const apiUtils = makeApiUtils(props.client)
    const idStores = makeIdStores(opts)

    const handler = makeHandler({
      ...idStores,
      signals: signalEmitter,
      auth,
      apiUtils,
    })

    const reqId = debug.debugRequest(props.req)
    const res = await handler(props)
    debug.debugResponse(reqId, res)

    return res
  },
})
