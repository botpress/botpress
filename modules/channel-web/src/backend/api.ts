import apicache from 'apicache'
import aws from 'aws-sdk'
import * as sdk from 'botpress/sdk'
import { asyncMiddleware as asyncMw, BPRequest } from 'common/http'
import { Response } from 'express'
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
const SUPPORTED_MESSAGES = [
  'text',
  'quick_reply',
  'form',
  'login_prompt',
  'visit',
  'request_start_conversation',
  'postback'
]

type ChatRequest = BPRequest & { userId: string; botId: string; conversationId: number }

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
    appendKey: req => `${req.method} for bot ${req.params?.boId}`,
    statusCodes: { include: [200] }
  }).middleware

  const assertUserInfo = (options: { convoIdRequired?: boolean } = {}) => async (req: ChatRequest, _res, next) => {
    const { botId } = req.params
    const { conversationId, webSessionId } = req.body || {}

    const userId = await bp.realtime.getVisitorIdFromGuestSocketId(webSessionId)
    if (!userId) {
      return next(ERR_BAD_USER_SESSION_ID)
    }

    if (!userIdIsValid(userId)) {
      return next(ERR_USER_ID_INVALID)
    }

    if (conversationId && conversationId !== 'null') {
      req.conversationId = parseInt(conversationId)

      if (!(await db.isValidConversationOwner(userId, req.conversationId, botId))) {
        next(ERR_BAD_CONV_ID)
      }
    }

    if (options.convoIdRequired && req.conversationId === undefined) {
      next(ERR_CONV_ID_REQ)
    }

    req.botId = botId
    req.userId = userId

    next()
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
        lazySocket: config.lazySocket
      })
    })
  )

  router.post(
    '/messages',
    bp.http.extractExternalToken,
    assertUserInfo(),
    asyncMiddleware(async (req: ChatRequest, res: Response) => {
      const { botId, userId } = req
      let { conversationId } = req

      const user = await bp.users.getOrCreateUser('web', userId, botId)
      const payload = req.body.payload || {}

      if (!SUPPORTED_MESSAGES.includes(payload.type)) {
        // TODO: Support files
        return res.status(400).send(ERR_MSG_TYPE)
      }

      if (payload.type === 'visit') {
        const { timezone, language } = payload
        const isValidTimezone = _.isNumber(timezone) && timezone >= -12 && timezone <= 14 && timezone % 0.5 === 0
        const isValidLanguage = language.length < 4 && !_.get(user, 'result.attributes.language')

        const newAttributes = {
          ...(isValidTimezone && { timezone }),
          ...(isValidLanguage && { language })
        }

        if (Object.getOwnPropertyNames(newAttributes).length) {
          await bp.users.updateAttributes('web', userId, newAttributes)
        }
      }

      if (!conversationId) {
        conversationId = await db.getOrCreateRecentConversation(botId, userId, { originatesFromUserMessage: true })
      }

      await sendNewMessage(
        botId,
        userId,
        conversationId,
        payload,
        req.credentials,
        !!req.headers.authorization,
        user.result
      )

      res.sendStatus(200)
    })
  )

  router.post(
    '/messages/files',
    upload.single('file'),
    bp.http.extractExternalToken,
    assertUserInfo({ convoIdRequired: true }),
    asyncMiddleware(async (req: ChatRequest & any, res: Response) => {
      const { botId, userId, conversationId } = req

      await bp.users.getOrCreateUser('web', userId, botId) // Just to create the user if it doesn't exist

      const payload = {
        text: `Uploaded a file [${req.file.originalname}]`,
        type: 'file',
        storage: req.file.location ? 's3' : 'local',
        url: req.file.location || req.file.path || undefined,
        name: req.file.filename,
        originalName: req.file.originalname,
        mime: req.file.contentType || req.file.mimetype,
        size: req.file.size
      }

      await sendNewMessage(botId, userId, conversationId, payload, req.credentials)

      return res.sendStatus(200)
    })
  )

  router.post(
    '/conversations/get',
    assertUserInfo({ convoIdRequired: true }),
    asyncMiddleware(async (req: ChatRequest, res: Response) => {
      const { userId, conversationId, botId } = req

      const conversation = await db.getConversation(userId, conversationId, botId)

      return res.send(conversation)
    })
  )

  router.post(
    '/conversations/list',
    assertUserInfo(),
    asyncMiddleware(async (req: ChatRequest, res: Response) => {
      const { userId, botId } = req

      await bp.users.getOrCreateUser('web', userId, botId)

      const conversations = await db.listConversations(userId, botId)
      const config = await bp.config.getModuleConfigForBot('channel-web', botId)

      return res.send({
        conversations: [...conversations],
        startNewConvoOnTimeout: config.startNewConvoOnTimeout,
        recentConversationLifetime: config.recentConversationLifetime
      })
    })
  )

  async function sendNewMessage(
    botId: string,
    userId: string,
    conversationId,
    payload,
    credentials: any,
    useDebugger?: boolean,
    user?: sdk.User
  ) {
    const config = await bp.config.getModuleConfigForBot('channel-web', botId)

    if (
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

    const event = bp.IO.Event({
      botId,
      channel: 'web',
      direction: 'incoming',
      payload,
      target: userId,
      threadId: conversationId,
      type: payload.type,
      credentials
    })

    if (useDebugger) {
      event.debugger = true
    }

    const message = await db.appendUserMessage(botId, userId, conversationId, sanitizedPayload, event.id, user)
    bp.realtime.sendPayload(bp.RealTimePayload.forVisitor(userId, 'webchat.message', message))

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
        conversationId = await db.getOrCreateRecentConversation(botId, userId, { originatesFromUserMessage: true })
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
      const { eventId, target, feedback } = req.body

      if (!target || !eventId || !feedback) {
        return res.status(400).send('Missing required fields')
      }

      try {
        await bp.events.saveUserFeedback(eventId, target, feedback, 'qna')
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
      const { target, eventIds } = req.body

      if (!target || !eventIds) {
        return res.status(400).send('Missing required fields')
      }

      res.send(await db.getFeedbackInfoForEventIds(target, eventIds))
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

      await sendNewMessage(botId, userId, conversationId, payload, req.credentials)

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
      const { botId, userId } = req

      const convoId = await db.createConversation(botId, userId)

      res.send({ convoId })
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
          conversationId = await db.getOrCreateRecentConversation(botId, userId, { originatesFromUserMessage: true })
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

  const convertToTxtFile = async conversation => {
    const { messages } = conversation
    const { result: user } = await bp.users.getOrCreateUser('web', conversation.userId)
    const timeFormat = 'MM/DD/YY HH:mm'
    const fullName = `${user.attributes['first_name'] || ''} ${user.attributes['last_name'] || ''}`
    const metadata = `Title: ${conversation.title}\r\nCreated on: ${moment(conversation.created_on).format(
      timeFormat
    )}\r\nUser: ${fullName}\r\n-----------------\r\n`

    const messagesAsTxt = messages.map(message => {
      const type = (message.payload && message.payload.type) || message.message_type
      if (type === 'session_reset') {
        return ''
      }
      const userName = message.full_name.indexOf('undefined') > -1 ? 'User' : message.full_name
      return `[${moment(message.sent_on).format(timeFormat)}] ${userName}: ${getMessageContent(message, type)}\r\n`
    })

    return [metadata, ...messagesAsTxt].join('')
  }

  router.post(
    '/conversations/download/txt',
    assertUserInfo({ convoIdRequired: true }),
    asyncMiddleware(async (req: ChatRequest, res: Response) => {
      const { userId, conversationId, botId } = req

      const conversation = await db.getConversation(userId, conversationId, botId)
      const txt = await convertToTxtFile(conversation)

      res.send({ txt, name: `${conversation.title}.txt` })
    })
  )

  router.post(
    '/conversations/messages/delete',
    assertUserInfo({ convoIdRequired: true }),
    asyncMiddleware(async (req: ChatRequest, res: Response) => {
      const { userId, conversationId } = req

      bp.realtime.sendPayload(bp.RealTimePayload.forVisitor(userId, 'webchat.clear', { conversationId }))

      await db.deleteConversationMessages(conversationId)

      res.sendStatus(204)
    })
  )
}
