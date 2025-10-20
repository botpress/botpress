import _ from 'lodash'
import * as errors from '../../gen/errors'
import { validateFid } from '../../id-store'
import * as types from '../types'

type FidHandler<O extends types.OperationName> = {
  mapRequest: () => Promise<types.AuthenticatedInputs[O]>
  mapResponse: (res: types.OperationOutputs[O]) => Promise<types.OperationOutputs[O]>
}

type FidHandlers = {
  [K in types.OperationName]: null | ((props: types.OperationProps, req: types.AuthenticatedInputs[K]) => FidHandler<K>)
}

export const merge = <T>(a: T, b: types.DeepPartial<T>): T => _.merge({}, a, b)

export const handlers = {
  createUser: (props: types.OperationProps, req: types.AuthenticatedInputs['createUser']) => ({
    mapRequest: async () => {
      const fid = req.body.id
      if (fid) {
        const validationResult = validateFid(fid)
        if (!validationResult.success) {
          throw new errors.InvalidPayloadError(validationResult.reason)
        }

        const id = await props.userIdStore.byFid.find(fid)
        if (id) {
          throw new errors.AlreadyExistsError(`User with id ${fid} already exists`)
        }
      }
      return merge(req, {
        body: {
          id: undefined,
        },
      })
    },
    mapResponse: async (res) => {
      const id = res.body.user.id
      const fid = req.body.id
      if (fid) {
        await props.userIdStore.byFid.set(fid, id)
      }
      return merge(res, {
        body: {
          user: {
            id: fid,
          },
        },
      })
    },
  }),
  getUser: (props: types.OperationProps, req: types.AuthenticatedInputs['getUser']) => ({
    mapRequest: async () =>
      merge(req, {
        auth: {
          userId: await props.userIdStore.byFid.get(req.auth.userId),
        },
      }),
    mapResponse: async (res) =>
      merge(res, {
        body: {
          user: {
            id: req.auth.userId,
          },
        },
      }),
  }),
  getOrCreateUser: null, // done inside the operation
  updateUser: (props: types.OperationProps, req: types.AuthenticatedInputs['updateUser']) => ({
    mapRequest: async () =>
      merge(req, {
        auth: {
          userId: await props.userIdStore.byFid.get(req.auth.userId),
        },
      }),
    mapResponse: async (res) =>
      merge(res, {
        body: {
          user: {
            id: req.auth.userId,
          },
        },
      }),
  }),
  deleteUser: (props: types.OperationProps, req: types.AuthenticatedInputs['deleteUser']) => ({
    mapRequest: async () =>
      merge(req, {
        auth: {
          userId: await props.userIdStore.byFid.get(req.auth.userId),
        },
      }),
    mapResponse: async (res) => {
      await props.userIdStore.byFid.delete(req.auth.userId)
      return res
    },
  }),
  createConversation: (props: types.OperationProps, req: types.AuthenticatedInputs['createConversation']) => ({
    mapRequest: async () => {
      const fid = req.body.id
      if (fid) {
        const validationResult = validateFid(fid)
        if (!validationResult.success) {
          throw new errors.InvalidPayloadError(validationResult.reason)
        }

        const id = await props.convIdStore.byFid.find(fid)
        if (id) {
          throw new errors.AlreadyExistsError(`Conversation with id ${fid} already exists`)
        }
      }
      return merge(req, {
        auth: {
          userId: await props.userIdStore.byFid.get(req.auth.userId),
        },
        body: {
          id: undefined,
        },
      })
    },
    mapResponse: async (res) => {
      const id = res.body.conversation.id
      const fid = req.body.id
      if (fid) {
        await props.convIdStore.byFid.set(fid, id)
      }

      return merge(res, {
        body: {
          conversation: {
            id: fid,
          },
        },
      })
    },
  }),
  getConversation: (props: types.OperationProps, req: types.AuthenticatedInputs['getConversation']) => ({
    mapRequest: async () => {
      const [userId, conversationId] = await Promise.all([
        props.userIdStore.byFid.get(req.auth.userId),
        props.convIdStore.byFid.get(req.params.id),
      ])
      return merge(req, {
        auth: {
          userId,
        },
        params: {
          id: conversationId,
        },
      })
    },
    mapResponse: async (res) =>
      merge(res, {
        body: {
          conversation: {
            id: req.params.id,
          },
        },
      }),
  }),
  getOrCreateConversation: null, // done inside the operation
  deleteConversation: (props: types.OperationProps, req: types.AuthenticatedInputs['deleteConversation']) => ({
    mapRequest: async () => {
      const [userId, conversationId] = await Promise.all([
        props.userIdStore.byFid.get(req.auth.userId),
        props.convIdStore.byFid.get(req.params.id),
      ])

      return merge(req, {
        auth: {
          userId,
        },
        params: {
          id: conversationId,
        },
      })
    },
    mapResponse: async (res) => {
      await props.convIdStore.byFid.delete(req.params.id)
      return res
    },
  }),
  listConversations: (props: types.OperationProps, req: types.AuthenticatedInputs['listConversations']) => ({
    mapRequest: async () =>
      merge(req, {
        auth: {
          userId: await props.userIdStore.byFid.get(req.auth.userId),
        },
      }),
    mapResponse: async (res) => {
      if (res.body.conversations.length === 0) {
        return res
      }

      const keys = res.body.conversations.map((c) => c.id)
      const values = await props.convIdStore.byId.fetch(keys)
      return merge(res, {
        body: {
          conversations: res.body.conversations.map((c) =>
            merge(c, {
              id: values.find(c.id) ?? c.id,
            })
          ),
        },
      })
    },
  }),
  listMessages: (props: types.OperationProps, req: types.AuthenticatedInputs['listMessages']) => ({
    mapRequest: async () => {
      const [userId, conversationId] = await Promise.all([
        props.userIdStore.byFid.get(req.auth.userId),
        props.convIdStore.byFid.get(req.params.conversationId),
      ])
      return merge(req, {
        auth: {
          userId,
        },
        params: {
          conversationId,
        },
      })
    },
    mapResponse: async (res) => {
      if (res.body.messages.length === 0) {
        return res
      }

      const keys = res.body.messages.map((m) => m.userId)
      const values = await props.userIdStore.byId.fetch(keys)

      return merge(res, {
        body: {
          messages: res.body.messages.map((m) => ({
            userId: values.find(m.userId) ?? m.userId,
            conversationId: req.params.conversationId,
          })),
        },
      })
    },
  }),
  listenConversation: (props: types.OperationProps, req: types.AuthenticatedInputs['listenConversation']) => ({
    mapRequest: async () => {
      const [userId, conversationId] = await Promise.all([
        props.userIdStore.byFid.get(req.auth.userId),
        props.convIdStore.byFid.get(req.params.id),
      ])

      return merge(req, {
        auth: {
          userId,
        },
        params: {
          id: conversationId,
        },
      })
    },
    mapResponse: async (res) => res,
  }),
  addParticipant: (props: types.OperationProps, req: types.AuthenticatedInputs['addParticipant']) => ({
    mapRequest: async () => {
      const [authUserId, userId, conversationId] = await Promise.all([
        props.userIdStore.byFid.get(req.auth.userId),
        props.userIdStore.byFid.get(req.body.userId),
        props.convIdStore.byFid.get(req.params.conversationId),
      ])

      return merge(req, {
        auth: {
          userId: authUserId,
        },
        body: {
          userId,
        } as Partial<types.OperationInputs['addParticipant']['body']>,
        params: {
          conversationId,
        },
      })
    },
    mapResponse: async (res) =>
      merge(res, {
        body: {
          participant: {
            id: req.body.userId,
          },
        },
      }),
  }),
  getParticipant: (props: types.OperationProps, req: types.AuthenticatedInputs['getParticipant']) => ({
    mapRequest: async () => {
      const [authUserId, userId, conversationId] = await Promise.all([
        props.userIdStore.byFid.get(req.auth.userId),
        props.userIdStore.byFid.get(req.params.userId),
        props.convIdStore.byFid.get(req.params.conversationId),
      ])

      return merge(req, {
        auth: {
          userId: authUserId,
        },
        params: {
          conversationId,
          userId,
        },
      })
    },
    mapResponse: async (res) =>
      merge(res, {
        body: {
          participant: {
            id: req.params.userId,
          },
        },
      }),
  }),
  removeParticipant: (props: types.OperationProps, req: types.AuthenticatedInputs['removeParticipant']) => ({
    mapRequest: async () => {
      const [authUserId, userId, conversationId] = await Promise.all([
        props.userIdStore.byFid.get(req.auth.userId),
        props.userIdStore.byFid.get(req.params.userId),
        props.convIdStore.byFid.get(req.params.conversationId),
      ])
      return merge(req, {
        auth: {
          userId: authUserId,
        },
        params: {
          conversationId,
          userId,
        },
      })
    },
    mapResponse: async (res) => res,
  }),
  listParticipants: (props: types.OperationProps, req: types.AuthenticatedInputs['listParticipants']) => ({
    mapRequest: async () => {
      const [authUserId, conversationId] = await Promise.all([
        props.userIdStore.byFid.get(req.auth.userId),
        props.convIdStore.byFid.get(req.params.conversationId),
      ])

      return merge(req, {
        auth: { userId: authUserId },
        params: {
          conversationId,
        },
      })
    },
    mapResponse: async (res) => {
      const keys = res.body.participants.map((p) => p.id)
      const values = await props.userIdStore.byId.fetch(keys)
      return merge(res, {
        body: {
          participants: res.body.participants.map((p) => ({
            id: values.find(p.id) ?? p.id,
          })),
        },
      })
    },
  }),
  createMessage: (props: types.OperationProps, req: types.AuthenticatedInputs['createMessage']) => ({
    mapRequest: async () => {
      const [userId, conversationId] = await Promise.all([
        props.userIdStore.byFid.get(req.auth.userId),
        props.convIdStore.byFid.get(req.body.conversationId),
      ])
      type CreateMessageReqBody = types.OperationInputs['createMessage']['body']
      return merge(req, {
        auth: {
          userId,
        },
        body: {
          conversationId,
        } as Partial<CreateMessageReqBody>,
      })
    },
    mapResponse: async (res) => {
      const { conversationId } = req.body
      const { userId } = req.auth
      return merge(res, {
        body: {
          message: {
            conversationId,
            userId,
          },
        },
      })
    },
  }),
  getMessage: (props: types.OperationProps, req: types.AuthenticatedInputs['getMessage']) => ({
    mapRequest: async () =>
      merge(req, {
        auth: {
          userId: await props.userIdStore.byFid.get(req.auth.userId),
        },
      }),
    mapResponse: async (res) =>
      merge(res, {
        body: {
          message: {
            id: req.params.id,
            conversationId: await props.convIdStore.byId.get(res.body.message.conversationId),
            userId: req.auth.userId,
          },
        },
      }),
  }),
  deleteMessage: (props: types.OperationProps, req: types.AuthenticatedInputs['deleteMessage']) => ({
    mapRequest: async () =>
      merge(req, {
        auth: {
          userId: await props.userIdStore.byFid.get(req.auth.userId),
        },
      }),
    mapResponse: async (res) => res,
  }),
  createEvent: (props: types.OperationProps, req: types.AuthenticatedInputs['createEvent']) => ({
    mapRequest: async () => {
      const [userId, conversationId] = await Promise.all([
        props.userIdStore.byFid.get(req.auth.userId),
        props.convIdStore.byFid.get(req.body.conversationId),
      ])
      type CreateEventReqBody = types.OperationInputs['createEvent']['body']
      return merge(req, {
        auth: {
          userId,
        },
        body: {
          conversationId,
        } as Partial<CreateEventReqBody>,
      })
    },
    mapResponse: async (res) => {
      const { conversationId } = req.body
      const { userId } = req.auth
      return merge(res, {
        body: {
          event: {
            conversationId,
            userId,
          },
        },
      })
    },
  }),
  getEvent: (props: types.OperationProps, req: types.AuthenticatedInputs['getEvent']) => ({
    mapRequest: async () =>
      merge(req, {
        auth: {
          userId: await props.userIdStore.byFid.get(req.auth.userId),
        },
      }),
    mapResponse: async (res) =>
      merge(res, {
        body: {
          event: {
            id: req.params.id,
            conversationId: await props.convIdStore.byId.get(res.body.event.conversationId),
            userId: req.auth.userId,
          },
        },
      }),
  }),
} satisfies FidHandlers
