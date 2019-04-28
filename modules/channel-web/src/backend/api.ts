import aws from 'aws-sdk'
import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import moment from 'moment'
import multer from 'multer'
import multers3 from 'multer-s3'
import path from 'path'

import { Config } from '../config'

import Database from './db'

const ERR_USER_ID_REQ = '`userId` is required and must be valid'
const ERR_MSG_TYPE = '`type` is required and must be valid'
const ERR_CONV_ID_REQ = '`conversationId` is required and must be valid'

export default async (bp: typeof sdk, db: Database) => {
  const globalConfig = (await bp.config.getModuleConfig('channel-web')) as Config

  const diskStorage = multer.diskStorage({
    destination: globalConfig.fileUploadPath,
    limits: {
      files: 1,
      fileSize: 5242880 // 5MB
    },
    filename: function(req, file, cb) {
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

    const s3 = new aws.S3(awsConfig)
    const s3Storage = multers3({
      s3: s3,
      bucket: globalConfig.uploadsS3Bucket || 'uploads',
      contentType: multers3.AUTO_CONTENT_TYPE,
      cacheControl: 'max-age=31536000', // one year caching
      acl: 'public-read',
      key: function(req, file, cb) {
        const userId = _.get(req, 'params.userId') || 'anonymous'
        const ext = path.extname(file.originalname)

        cb(undefined, `${userId}_${new Date().getTime()}${ext}`)
      }
    })

    upload = multer({ storage: s3Storage })
  }

  const router = bp.http.createRouterForBot('channel-web', { checkAuthentication: false, enableJsonBodyParser: true })

  const asyncApi = fn => async (req, res, next) => {
    try {
      await fn(req, res, next)
    } catch (err) {
      bp.logger.attachError(err).error('HTTP Handling Error')
      res.status(500).send(err && err.message)
    }
  }

  router.get(
    '/botInfo',
    asyncApi(async (req, res) => {
      const { botId } = req.params
      const config = (await bp.config.getModuleConfigForBot('channel-web', botId)) as Config
      const botInfo = await bp.bots.getBotById(botId)

      if (!botInfo) {
        return res.sendStatus(404)
      }

      res.send({
        showBotInfoPage: (config.infoPage && config.infoPage.enabled) || config.showBotInfoPage,
        name: botInfo.name,
        description: (config.infoPage && config.infoPage.description) || botInfo.description,
        details: botInfo.details
      })
    })
  )

  // ?conversationId=xxx (optional)
  router.post(
    '/messages/:userId',
    bp.http.extractExternalToken,
    asyncApi(async (req, res) => {
      const { botId, userId = undefined } = req.params

      if (!validateUserId(userId)) {
        return res.status(400).send(ERR_USER_ID_REQ)
      }

      const user = await bp.users.getOrCreateUser('web', userId)
      const payload = req.body || {}

      let { conversationId = undefined } = req.query || {}
      conversationId = conversationId && parseInt(conversationId)

      if (
        !_.includes(
          ['text', 'quick_reply', 'form', 'login_prompt', 'visit', 'request_start_conversation', 'postback'],
          payload.type
        )
      ) {
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

      await sendNewMessage(botId, userId, conversationId, payload, req.credentials)

      return res.sendStatus(200)
    })
  )

  // ?conversationId=xxx (required)
  router.post(
    '/messages/:userId/files',
    upload.single('file'),
    bp.http.extractExternalToken,
    asyncApi(async (req, res) => {
      const { botId = undefined, userId = undefined } = req.params || {}

      if (!validateUserId(userId)) {
        return res.status(400).send(ERR_USER_ID_REQ)
      }

      await bp.users.getOrCreateUser('web', userId) // Just to create the user if it doesn't exist

      let { conversationId = undefined } = req.query || {}
      conversationId = conversationId && parseInt(conversationId)

      if (!conversationId) {
        return res.status(400).send(ERR_CONV_ID_REQ)
      }

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

  router.get('/conversations/:userId/:conversationId', async (req, res) => {
    const { userId, conversationId, botId } = req.params

    if (!validateUserId(userId)) {
      return res.status(400).send(ERR_USER_ID_REQ)
    }

    const conversation = await db.getConversation(userId, conversationId, botId)

    return res.send(conversation)
  })

  router.get('/conversations/:userId', async (req, res) => {
    const { botId = undefined, userId = undefined } = req.params || {}

    if (!validateUserId(userId)) {
      return res.status(400).send(ERR_USER_ID_REQ)
    }

    await bp.users.getOrCreateUser('web', userId)

    const conversations = await db.listConversations(userId, botId)

    const config = await bp.config.getModuleConfigForBot('channel-web', botId)

    return res.send({
      conversations: [...conversations],
      startNewConvoOnTimeout: config.startNewConvoOnTimeout,
      recentConversationLifetime: config.recentConversationLifetime
    })
  })

  function validateUserId(userId) {
    return /[a-z0-9-_]+/i.test(userId)
  }

  async function sendNewMessage(botId: string, userId: string, conversationId, payload, credentials: any) {
    const config = await bp.config.getModuleConfigForBot('channel-web', botId)

    if (
      (!payload.text || !_.isString(payload.text) || payload.text.length > config.maxMessageLength) &&
      payload.type != 'postback'
    ) {
      throw new Error('Text must be a valid string of less than 360 chars')
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

    const message = await db.appendUserMessage(botId, userId, conversationId, sanitizedPayload)

    bp.realtime.sendPayload(bp.RealTimePayload.forVisitor(userId, 'webchat.message', message))
    return bp.events.sendEvent(event)
  }

  router.post(
    '/events/:userId',
    bp.http.extractExternalToken,
    asyncApi(async (req, res) => {
      const payload = req.body || {}
      const { botId = undefined, userId = undefined } = req.params || {}
      await bp.users.getOrCreateUser('web', userId)
      const conversationId = await db.getOrCreateRecentConversation(botId, userId, { originatesFromUserMessage: true })

      const event = bp.IO.Event({
        botId,
        channel: 'web',
        direction: 'incoming',
        target: userId,
        threadId: conversationId,
        type: payload.type,
        payload,
        credentials: req.credentials
      })

      bp.events.sendEvent(event)
      res.sendStatus(200)
    })
  )

  router.post(
    '/conversations/:userId/:conversationId/reset',
    bp.http.extractExternalToken,
    asyncApi(async (req, res) => {
      const { botId, userId, conversationId } = req.params
      await bp.users.getOrCreateUser('web', userId)

      const payload = {
        text: `Reset the conversation`,
        type: 'session_reset'
      }

      await sendNewMessage(botId, userId, conversationId, payload, req.credentials)

      const sessionId = await bp.dialog.createId({ botId, target: userId, threadId: conversationId, channel: 'web' })
      await bp.dialog.deleteSession(sessionId)
      res.sendStatus(200)
    })
  )

  router.post('/conversations/:userId/new', async (req, res) => {
    const { userId, botId } = req.params
    const convoId = await db.createConversation(botId, userId)
    res.send({ convoId })
  })

  router.get('/:userId/reference', async (req, res) => {
    try {
      const {
        params: { userId },
        query: { ref: webchatUrlQuery }
      } = req

      // FIXME
      // const state = await bp.dialogEngine.stateManager.getState(userId)
      // const newState = { ...state, webchatUrlQuery }

      // FIXME
      // await bp.dialogEngine.stateManager.setState(userId, newState)

      res.status(200)
    } catch (error) {
      res.status(500)
    }
  })

  const getMessageContent = (message, type) => {
    const { payload } = message

    if (type === 'file') {
      return (payload && payload.url) || message.message_data.url
    } else if (type === 'text' || type === 'quick_reply') {
      return (payload && payload.text) || message.message_text
    } else {
      return `Event (${type})`
    }
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

  router.get('/conversations/:userId/:conversationId/download/txt', async (req, res) => {
    const { userId, conversationId, botId } = req.params

    if (!validateUserId(userId)) {
      return res.status(400).send(ERR_USER_ID_REQ)
    }

    const conversation = await db.getConversation(userId, conversationId, botId)
    const txt = await convertToTxtFile(conversation)

    res.send({ txt, name: `${conversation.title}.txt` })
  })
}
