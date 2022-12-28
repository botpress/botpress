import apicache from 'apicache'
import aws from 'aws-sdk'
import axios from 'axios'
import * as sdk from 'botpress/sdk'
import { Conversation, Message, MessagingClient } from 'botpress/sdk'
import { asyncMiddleware as asyncMw, BPRequest } from 'common/http'
import { Request, Response, NextFunction } from 'express'
import FormData from 'form-data'
import _ from 'lodash'
import moment from 'moment'
import multer from 'multer'
import multers3 from 'multer-s3'
import path from 'path'

import { Config } from '../config'

import Database from './db'

const ERR_USER_ID_INVALID = 'user id associated with this session must be valid'
const ERR_MSG_TYPE = '`type` is required and must be valid'
const ERR_CONV_ID_REQ = '`conversationId` is required and must be valid'
const ERR_BAD_LANGUAGE = '`language` is required and must be valid'
const ERR_BAD_CONV_ID = "The conversation ID doesn't belong to that user"
const ERR_BAD_USER_SESSION_ID = 'session id is invalid'

const USER_ID_MAX_LENGTH = 40
const MAX_MESSAGE_HISTORY = 100
const SUPPORTED_MESSAGES = [
  'text',
  'quick_reply',
  'form',
  'login_prompt',
  'visit',
  'request_start_conversation',
  'postback',
  'voice'
]

const WEBCHAT_CUSTOM_ID_KEY = 'webchatCustomId'

type ChatRequest = BPRequest & {
  visitorId: string
  userId: string
  botId: string
  conversationId: string
  messaging: MessagingClient
}

const userIdIsValid = (userId: string): boolean => {
  const hasBreakingConstraints = userId.length > USER_ID_MAX_LENGTH || userId.toLowerCase() === 'undefined'

  return !hasBreakingConstraints && /[a-z0-9-_]+/i.test(userId)
}

export default async (bp: typeof sdk, db: Database) => {
  const asyncMiddleware = asyncMw(bp.logger)
  const globalConfig = (await bp.config.getModuleConfig('channel-web')) as Config

  const diskStorage = multer.diskStorage({
    destination: globalConfig.fileUploadPath,
    // @ts-ignore typing indicates that limits isn't supported
    limits: {
      files: 1,
      fileSize: 5242880 // 5MB
    },
    filename(req, file, cb) {
      const userId = _.get(req, 'params.userId') || 'anonymous'
      const ext = path.extname(file.originalname)

      cb(undefined, `${userId}_${new Date().getTime()}${ext}`)
    }
  })

  let upload = multer({ storage: diskStorage })

  if (globalConfig.uploadsUseS3) {
    /*
      You can override AWS's default settings here. Example:
      { region: 'us-east-1', apiVersion: '2014-10-01', credentials: {...} }
     */
    const awsConfig = {
      region: globalConfig.uploadsS3Region,
      credentials: {
        accessKeyId: globalConfig.uploadsS3AWSAccessKey,
        secretAccessKey: globalConfig.uploadsS3AWSAccessSecret
      }
    }

    if (!awsConfig.credentials.accessKeyId && !awsConfig.credentials.secretAccessKey) {
      delete awsConfig.credentials
    }

    if (!awsConfig.region) {
      delete awsConfig.region
    }

    // TODO use media service with a 's3' backend
    const s3 = new aws.S3(awsConfig)
    const s3Storage = multers3({
      s3,
      bucket: globalConfig.uploadsS3Bucket || 'uploads',
      contentType: multers3.AUTO_CONTENT_TYPE,
      cacheControl: 'max-age=31536000', // one year caching
      acl: 'public-read',
      key(req, file, cb) {
        const userId = _.get(req, 'params.userId') || 'anonymous'
        const ext = path.extname(file.originalname)

        cb(undefined, `${userId}_${new Date().getTime()}${ext}`)
      }
    })

    upload = multer({ storage: s3Storage })
  }

  const router = bp.http.createRouterForBot('channel-web', { checkAuthentication: false, enableJsonBodyParser: true })
  const perBotCache = apicache.options({
    appendKey: (req: Request, _res: Response) => `${req.method} for bot ${req.params?.boId}`,
    statusCodes: { include: [200] }
  }).middleware

  const assertUserInfo = (options: { convoIdRequired?: boolean } = {}) => async (
    req: ChatRequest,
    _res: Response,
    next: NextFunction
  ) => {
    const { botId } = req.params
    const { conversationId, webSessionId } = req.body || {}

    req.visitorId = await bp.realtime.getVisitorIdFromGuestSocketId(webSessionId)
    if (!req.visitorId) {
      return next(ERR_BAD_USER_SESSION_ID)
    }

    if (!userIdIsValid(req.visitorId)) {
      return next(ERR_USER_ID_INVALID)
    }

    req.messaging = bp.messaging.forBot(botId)
    const userId = await db.mapVisitor(botId, req.visitorId)

    if (conversationId) {
      let conversation: Conversation
      try {
        conversation = await req.messaging.getConversation(conversationId)
      } catch {}

      if (!conversation || !userId || conversation.userId !== userId) {
        return next(ERR_BAD_CONV_ID)
      }

      req.conversationId = conversationId
    }

    if (options.convoIdRequired && req.conversationId === undefined) {
      return next(ERR_CONV_ID_REQ)
    }

    req.botId = botId
    req.userId = userId

    next()
  }

  const getRecent = async (messaging: MessagingClient, userId: string) => {
    const convs = await messaging.listConversations(userId, 1)
    if (convs?.length) {
      return convs[0]
    }

    return messaging.createConversation(userId)
  }

  router.get(
    '/botInfo',
    perBotCache('1 minute'),
    asyncMiddleware(async (req: BPRequest, res: Response) => {
      const { botId } = req.params
      const security = ((await bp.config.getModuleConfig('channel-web')) as Config).security // usage of global because a user could overwrite bot scoped configs
      const config = (await bp.config.getModuleConfigForBot('channel-web', botId)) as Config
      const botInfo = await bp.bots.getBotById(botId)

      if (!botInfo) {
        return res.sendStatus(404)
      }

      res.send({
        showBotInfoPage: (config.infoPage && config.infoPage.enabled) || config.showBotInfoPage,
        name: botInfo.name,
        description: (config.infoPage && config.infoPage.description) || botInfo.description,
        details: botInfo.details,
        languages: botInfo.languages,
        extraStylesheet: config.extraStylesheet,
        disableNotificationSound: config.disableNotificationSound,
        security,
        lazySocket: config.lazySocket,
        maxMessageLength: config.maxMessageLength,
        alwaysScrollDownOnMessages: config.alwaysScrollDownOnMessages
      })
    })
  )

  router.post(
    '/users/customId',
    bp.http.extractExternalToken,
    assertUserInfo(),
    asyncMiddleware(async (req: ChatRequest, res: Response) => {
      const { botId, userId } = req
      const { customId } = req.body

      if (!customId) {
        return res.sendStatus(400)
      }

      await bp.users.getOrCreateUser('web', userId, botId)
      await bp.users.updateAttributes('web', userId, { [WEBCHAT_CUSTOM_ID_KEY]: customId })

      res.sendStatus(200)
    })
  )

  router.post(
    '/messages',
    bp.http.extractExternalToken,
    assertUserInfo(),
    asyncMiddleware(async (req: ChatRequest, res: Response) => {
      const { botId, userId } = req

      const payload = req.body.payload || {}

      if (!SUPPORTED_MESSAGES.includes(payload.type)) {
        return res.status(400).send(ERR_MSG_TYPE)
      }

      if (!req.conversationId) {
        req.conversationId = (await getRecent(req.messaging, userId)).id
      }

      await sendNewMessage(req, payload, !!req.headers.authorization)

      res.sendStatus(200)
    })
  )

  router.post(
    '/messages/files',
    upload.single('file'),
    bp.http.extractExternalToken,
    assertUserInfo({ convoIdRequired: true }),
    asyncMiddleware(async (req: ChatRequest & any, res: Response) => {
      const { botId, userId } = req
      const payloadValue = req.body.payload || {}

      await bp.users.getOrCreateUser('web', userId, botId) // Just to create the user if it doesn't exist

      const payload = {
        text: `Uploaded a file **${req.file.originalname}**`,
        type: 'file',
        storage: req.file.location ? 's3' : 'local',
        url: req.file.location || req.file.path || undefined,
        name: req.file.filename,
        originalName: req.file.originalname,
        mime: req.file.contentType || req.file.mimetype,
        size: req.file.size,
        payload: payloadValue
      }

      await sendNewMessage(req, payload, false)

      return res.sendStatus(200)
    })
  )

  router.post(
    '/messages/voice',
    bp.http.extractExternalToken,
    assertUserInfo({ convoIdRequired: true }),
    asyncMiddleware(async (req: ChatRequest, res: Response) => {
      const { botId, userId } = req
      const { audio } = req.body

      if (!audio?.buffer || !audio?.title) {
        throw new Error('Voices messages must contain an audio buffer and title')
      }

      await bp.users.getOrCreateUser('web', userId, botId) // Just to create the user if it doesn't exist

      const buffer = Buffer.from(audio!.buffer, 'base64')

      const formData = new FormData()
      formData.append('file', buffer, audio!.title)

      const axiosConfig = await bp.http.getAxiosConfigForBot(botId, { studioUrl: true })
      axiosConfig.headers['Content-Type'] = `multipart/form-data; boundary=${formData.getBoundary()}`

      // Upload the audio buffer to the Media Service
      const {
        data: { url }
      } = await axios.post<{ url: string }>('/media', formData, {
        ...axiosConfig
      })

      const payload = {
        type: 'voice',
        audio: url
      }

      await sendNewMessage(req, payload, false)

      return res.sendStatus(200)
    })
  )

  router.post(
    '/conversations/get',
    assertUserInfo({ convoIdRequired: true }),
    asyncMiddleware(async (req: ChatRequest, res: Response) => {
      const { conversationId, botId } = req

      const config = (await bp.config.getModuleConfigForBot('channel-web', botId)) as Config
      const conversation = await req.messaging.getConversation(conversationId)
      const messages = await req.messaging.listMessages(conversationId, config.maxMessagesHistory)

      // this function scope can (and probably will) expand to other types as well with a switch case on the type
      // we do something similar in the cms to determine weather there are translated fields or not
      const notEmptyPayload = payload => (payload.type === 'text' ? !!payload.text : true)

      const displayableMessages = messages.filter(({ payload }) => payload.type !== 'visit' && notEmptyPayload(payload))

      return res.send({ ...conversation, messages: displayableMessages })
    })
  )

  router.post(
    '/conversations/list',
    assertUserInfo(),
    asyncMiddleware(async (req: ChatRequest, res: Response) => {
      const { userId, botId } = req

      await bp.users.getOrCreateUser('web', userId, botId)

      const conversations = await req.messaging.listConversations(userId, MAX_MESSAGE_HISTORY)
      const config = await bp.config.getModuleConfigForBot('channel-web', botId)

      const convsWithLastMessage: (Conversation & { lastMessage?: Message })[] = []
      for (const conversation of conversations) {
        convsWithLastMessage.push({
          ...conversation,
          lastMessage: (await req.messaging.listMessages(conversation.id, 1))[0]
        })
      }

      return res.send({
        conversations: convsWithLastMessage,
        startNewConvoOnTimeout: config.startNewConvoOnTimeout,
        recentConversationLifetime: config.recentConversationLifetime
      })
    })
  )

  async function sendNewMessage(req: ChatRequest, payload: any, useDebugger: boolean) {
    const config = await bp.config.getModuleConfigForBot('channel-web', req.botId)

    if (payload.type === 'voice') {
      if (_.isEmpty(payload.audio)) {
        throw new Error('Voices messages must contain an audio buffer')
      }
    } else if (
      (!payload.text || !_.isString(payload.text) || payload.text.length > config.maxMessageLength) &&
      payload.type !== 'postback'
    ) {
      throw new Error(`Text must be a valid string of less than ${config.maxMessageLength} chars`)
    }

    let sanitizedPayload = payload
    if (payload.sensitive) {
      const sensitive = Array.isArray(payload.sensitive) ? payload.sensitive : [payload.sensitive]
      sanitizedPayload = _.omit(payload, [...sensitive, 'sensitive'])
    }

    const message = await req.messaging.createMessage(req.conversationId, req.userId, sanitizedPayload)
    const event = bp.IO.Event({
      messageId: message.id,
      botId: req.botId,
      channel: 'web',
      direction: 'incoming',
      payload,
      target: req.userId,
      threadId: req.conversationId,
      type: payload.type,
      credentials: req.credentials
    })

    if (useDebugger) {
      event.debugger = true
    }

    bp.realtime.sendPayload(bp.RealTimePayload.forVisitor(req.visitorId, 'webchat.message', message))

    await bp.events.sendEvent(event)
  }

  router.post(
    '/events',
    bp.http.extractExternalToken,
    assertUserInfo(),
    asyncMiddleware(async (req: ChatRequest, res: Response) => {
      const { userId, botId } = req
      let { conversationId } = req

      const payload = req.body.payload || {}

      await bp.users.getOrCreateUser('web', userId, botId)

      if (!conversationId) {
        conversationId = (await getRecent(req.messaging, userId)).id
      }

      const event = bp.IO.Event({
        botId,
        channel: 'web',
        direction: 'incoming',
        target: userId,
        threadId: conversationId.toString(),
        type: payload.type,
        payload,
        credentials: req.credentials
      })

      await bp.events.sendEvent(event)
      res.sendStatus(200)
    })
  )

  router.post(
    '/saveFeedback',
    bp.http.extractExternalToken,
    asyncMiddleware(async (req: BPRequest, res: Response) => {
      const { botId } = req.params
      const { messageId, target, feedback } = req.body

      if (!target || !messageId || !feedback) {
        return res.status(400).send('Missing required fields')
      }

      const [event] = await bp.events.findEvents({ botId, messageId })
      const { userId } = await db.getMappingFromVisitor(botId, target)

      try {
        await bp.events.saveUserFeedback(event.incomingEventId, userId, feedback, 'qna')
        res.sendStatus(200)
      } catch (err) {
        res.status(400).send(err)
      }
    })
  )

  router.post(
    '/feedbackInfo',
    bp.http.extractExternalToken,
    asyncMiddleware(async (req: BPRequest, res: Response) => {
      const { botId } = req.params
      const { target, messageIds } = req.body

      if (!target || !messageIds) {
        return res.status(400).send('Missing required fields')
      }

      const { userId } = await db.getMappingFromVisitor(botId, target)
      res.send(await db.getFeedbackInfoForMessageIds(userId, messageIds))
    })
  )

  router.post(
    '/conversations/reset',
    bp.http.extractExternalToken,
    assertUserInfo({ convoIdRequired: true }),
    asyncMiddleware(async (req: ChatRequest, res: Response) => {
      const { botId, userId, conversationId } = req
      await bp.users.getOrCreateUser('web', userId, botId)

      const payload = {
        text: 'Reset the conversation',
        type: 'session_reset'
      }

      await sendNewMessage(req, payload, false)

      const sessionId = bp.dialog.createId({
        botId,
        target: userId,
        threadId: conversationId.toString(),
        channel: 'web'
      })

      await bp.dialog.deleteSession(sessionId, botId)
      res.sendStatus(200)
    })
  )

  router.post(
    '/conversations/new',
    assertUserInfo(),
    asyncMiddleware(async (req: ChatRequest, res: Response) => {
      const { userId } = req

      const conversation = await req.messaging.createConversation(userId)

      res.send({ convoId: conversation.id })
    })
  )

  router.post(
    '/conversations/reference',
    assertUserInfo(),
    asyncMiddleware(async (req: ChatRequest, res: Response) => {
      try {
        const { botId, userId } = req
        const { reference } = req.body
        let { conversationId } = req

        await bp.users.getOrCreateUser('web', userId, botId)

        if (typeof reference !== 'string' || !reference.length || reference.indexOf('=') === -1) {
          throw new Error('Invalid reference')
        }

        if (!conversationId) {
          conversationId = (await getRecent(req.messaging, userId)).id
        }

        const message = reference.slice(0, reference.lastIndexOf('='))
        const signature = reference.slice(reference.lastIndexOf('=') + 1)

        const verifySignature = await bp.security.getMessageSignature(message)
        if (verifySignature !== signature) {
          throw new Error('Bad reference signature')
        }

        const payload = {
          text: message,
          signature,
          type: 'session_reference'
        }

        const event = bp.IO.Event({
          botId,
          channel: 'web',
          direction: 'incoming',
          target: userId,
          threadId: conversationId.toString(),
          type: payload.type,
          payload,
          credentials: req['credentials']
        })

        await bp.events.sendEvent(event)
        res.sendStatus(200)
      } catch (error) {
        res.status(500).send({ message: error.message })
      }
    })
  )

  router.post(
    '/preferences/get',
    assertUserInfo(),
    asyncMiddleware(async (req: ChatRequest, res: Response) => {
      const { userId, botId } = req
      const { result } = await bp.users.getOrCreateUser('web', userId, botId)

      return res.send({ language: result.attributes.language })
    })
  )

  router.post(
    '/preferences',
    assertUserInfo(),
    asyncMiddleware(async (req: ChatRequest, res: Response) => {
      const { userId, botId } = req
      const payload = req.body || {}
      const preferredLanguage = payload.language

      const bot = await bp.bots.getBotById(botId)
      const validLanguage = bot.languages.includes(preferredLanguage)
      if (!validLanguage) {
        return res.status(400).send(ERR_BAD_LANGUAGE)
      }

      await bp.users.updateAttributes('web', userId, {
        language: preferredLanguage
      })

      return res.sendStatus(200)
    })
  )

  const getMessageContent = (message, type) => {
    const { payload } = message

    if (type === 'file') {
      return (payload && payload.url) || message.message_data.url
    }

    const wrappedText = _.get(payload, 'wrapped.text')
    return (payload && payload.text) || message.message_text || wrappedText || `Event (${type})`
  }

  const convertToTxtFile = async (botId: string, conversation: Conversation & { messages: Message[] }) => {
    const { messages } = conversation
    const { result: user } = await bp.users.getOrCreateUser('web', conversation.userId)
    const timeFormat = 'MM/DD/YY HH:mm'
    const fullName = `${user.attributes['first_name'] || ''} ${user.attributes['last_name'] || ''}`
    const metadata = `Conversation Id: ${conversation.id}\r\nCreated on: ${moment(conversation.createdOn).format(
      timeFormat
    )}\r\nUser: ${fullName}\r\n-----------------\r\n`

    const messagesAsTxt = messages.map(message => {
      const type = message.payload?.type
      if (type === 'session_reset') {
        return ''
      }
      return `[${moment(message.sentOn).format(timeFormat)}] ${message.authorId ? 'User' : botId}: ${getMessageContent(
        message,
        type
      )}\r\n`
    })

    return [metadata, ...messagesAsTxt].join('')
  }

  router.post(
    '/conversations/download/txt',
    assertUserInfo({ convoIdRequired: true }),
    asyncMiddleware(async (req: ChatRequest, res: Response) => {
      const { conversationId, botId } = req

      const config = (await bp.config.getModuleConfigForBot('channel-web', botId)) as Config
      const conversation = await req.messaging.getConversation(conversationId)
      const messages = await req.messaging.listMessages(conversationId, config.maxMessagesHistory)

      const txt = await convertToTxtFile(botId, { ...conversation, messages })

      res.send({ txt, name: `Conversation ${conversation.id}.txt` })
    })
  )

  router.post(
    '/conversations/messages/delete',
    assertUserInfo({ convoIdRequired: true }),
    asyncMiddleware(async (req: ChatRequest, res: Response) => {
      const { visitorId, conversationId } = req

      bp.realtime.sendPayload(bp.RealTimePayload.forVisitor(visitorId, 'webchat.clear', { conversationId }))

      await req.messaging.deleteMessagesByConversation(conversationId)

      res.sendStatus(204)
    })
  )

  // NOTE: this is a temporary route and allows an agent to delete a channel web user's conversation messages
  // until today this was completed by calling channel web api directly but it's api has been secured with a temporary sessionId
  // soon enough, once channel-web's implementation moves to messaging api we'll be able to remove this and use messaging directly
  // usage of a private router because authentication is handled for us
  const privateRouter = bp.http.createRouterForBot('channel-web-private')

  // NOTE : this uses duplicated code taken from public route (ln#624 - ln#636) so it's easy to remove once we can (see prev note)
  privateRouter.post(
    '/conversations/:id/messages/delete',
    asyncMiddleware(async (req: ChatRequest, res: Response) => {
      const { botId } = req.params
      const conversationId = req.params.id
      const { userId } = req.body

      const conversation = await bp.messaging.forBot(botId).getConversation(conversationId)
      if (!userId || conversation?.userId !== userId) {
        return res.status(400).send(ERR_BAD_CONV_ID)
      }

      const { visitorId } = await db.getMappingFromUser(userId)
      bp.realtime.sendPayload(bp.RealTimePayload.forVisitor(visitorId, 'webchat.clear', { conversationId }))

      await bp.messaging.forBot(botId).deleteMessagesByConversation(conversationId)
      res.sendStatus(204)
    })
  )
}
