import _ from 'lodash'
import path from 'path'
import multer from 'multer'
import multers3 from 'multer-s3'
import aws from 'aws-sdk'
import moment from 'moment'

import injectScript from 'raw-loader!./inject.js'
import injectStyle from 'raw-loader!./inject.css'

import serveStatic from 'serve-static'

import db from './db'
import users from './users'

const ERR_USER_ID_REQ = '`userId` is required and must be valid'
const ERR_MSG_TYPE = '`type` is required and must be valid'
const ERR_CONV_ID_REQ = '`conversationId` is required and must be valid'

module.exports = async (bp, config) => {
  const diskStorage = multer.diskStorage({
    limits: {
      files: 1,
      fileSize: 5242880 // 5MB
    },
    filename: function(req, file, cb) {
      const userId = _.get(req, 'params.userId') || 'anonymous'
      const ext = path.extname(file.originalname)

      cb(null, `${userId}_${new Date().getTime()}${ext}`)
    }
  })

  let upload = multer({ storage: diskStorage })

  if (config.uploadsUseS3) {
    /*
      You can override AWS's default settings here. Example:
      { region: 'us-east-1', apiVersion: '2014-10-01', credentials: {...} }
     */
    const awsConfig = {
      region: config.uploadsS3Region,
      credentials: {
        accessKeyId: config.uploadsS3AWSAccessKey,
        secretAccessKey: config.uploadsS3AWSAccessSecret
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
      bucket: config.uploadsS3Bucket || 'uploads',
      contentType: multers3.AUTO_CONTENT_TYPE,
      cacheControl: 'max-age=31536000', // one year caching
      acl: 'public-read',
      key: function(req, file, cb) {
        const userId = _.get(req, 'params.userId') || 'anonymous'
        const ext = path.extname(file.originalname)

        cb(null, `${userId}_${new Date().getTime()}${ext}`)
      }
    })

    upload = multer({ storage: s3Storage })
  }

  const knex = await bp.db.get()

  const {
    listConversations,
    getConversation,
    appendUserMessage,
    getOrCreateRecentConversation,
    createConversation
  } = db(knex, config)

  const { getOrCreateUser, getUserProfile } = await users(bp, config)

  const router = bp.getRouter('botpress-platform-webchat', { auth: false })

  const asyncApi = fn => async (req, res, next) => {
    try {
      await fn(req, res, next)
    } catch (err) {
      bp.logger.error(err.message, err.stack)
      res.status(500).send(err && err.message)
    }
  }

  router.get('/inject.js', (req, res) => {
    res.contentType('text/javascript')
    res.send(injectScript)
  })

  router.get('/inject.css', (req, res) => {
    res.contentType('text/css')
    res.send(injectStyle)
  })

  const pkg = require('../package.json')
  const modulePath = bp._loadedModules[pkg.name].root
  const staticFolder = path.join(modulePath, './static')
  router.use('/static', serveStatic(staticFolder))

  // ?conversationId=xxx (optional)
  router.post(
    '/messages/:userId',
    asyncApi(async (req, res) => {
      const { userId } = req.params || {}

      if (!validateUserId(userId)) {
        return res.status(400).send(ERR_USER_ID_REQ)
      }

      await getOrCreateUser(userId) // Just to create the user if it doesn't exist

      const payload = req.body || {}
      let { conversationId } = req.query || {}
      conversationId = conversationId && parseInt(conversationId)

      if (!_.includes(['text', 'quick_reply', 'form', 'login_prompt', 'visit'], payload.type)) {
        // TODO: Support files
        return res.status(400).send(ERR_MSG_TYPE)
      }

      if (!conversationId) {
        conversationId = await getOrCreateRecentConversation(userId, { originatesFromUserMessage: true })
      }

      await sendNewMessage(userId, conversationId, payload)

      return res.sendStatus(200)
    })
  )

  // ?conversationId=xxx (required)
  router.post(
    '/messages/:userId/files',
    upload.single('file'),
    asyncApi(async (req, res) => {
      const { userId } = req.params || {}

      if (!validateUserId(userId)) {
        return res.status(400).send(ERR_USER_ID_REQ)
      }

      await getOrCreateUser(userId) // Just to create the user if it doesn't exist

      let { conversationId } = req.query || {}
      conversationId = conversationId && parseInt(conversationId)

      if (!conversationId) {
        return res.status(400).send(ERR_CONV_ID_REQ)
      }

      const payload = {
        text: `Uploaded a file [${req.file.originalname}]`,
        type: 'file',
        data: {
          storage: req.file.location ? 's3' : 'local',
          url: req.file.location || null,
          name: req.file.originalname,
          mime: req.file.contentType || req.file.mimetype,
          size: req.file.size
        }
      }

      await sendNewMessage(userId, conversationId, payload)

      return res.sendStatus(200)
    })
  )

  router.get('/conversations/:userId/:conversationId', async (req, res) => {
    const { userId, conversationId } = req.params || {}

    if (!validateUserId(userId)) {
      return res.status(400).send(ERR_USER_ID_REQ)
    }

    const conversation = await getConversation(userId, conversationId)

    return res.send(conversation)
  })

  router.get('/conversations/:userId', async (req, res) => {
    const { userId } = req.params || {}

    if (!validateUserId(userId)) {
      return res.status(400).send(ERR_USER_ID_REQ)
    }

    await getOrCreateUser(userId) // Just to create the user if it doesn't exist

    const conversations = await listConversations(userId)

    return res.send({
      conversations: [...conversations],
      startNewConvoOnTimeout: config.startNewConvoOnTimeout,
      recentConversationLifetime: config.recentConversationLifetime
    })
  })

  function validateUserId(userId) {
    return /[a-z0-9-_]+/i.test(userId)
  }

  async function sendNewMessage(userId, conversationId, payload) {
    if (!payload.text || !_.isString(payload.text) || payload.text.length > 360) {
      throw new Error('Text must be a valid string of less than 360 chars')
    }

    let sanitizedPayload = _.pick(payload, ['text', 'type', 'data'])

    // let the bot programmer make extra cleanup
    if (bp.webchat && bp.webchat.sanitizeIncomingMessage) {
      sanitizedPayload = bp.webchat.sanitizeIncomingMessage(sanitizedPayload) || sanitizedPayload
    }

    // Because we don't necessarily persist what we emit/received
    const persistedPayload = { ...sanitizedPayload }

    // We remove the password from the persisted messages for security reasons
    if (payload.type === 'login_prompt') {
      persistedPayload.data = _.omit(persistedPayload.data, ['password'])
    }

    if (payload.type === 'form') {
      persistedPayload.data.formId = payload.formId
    }

    const message = await appendUserMessage(userId, conversationId, persistedPayload)

    Object.assign(message, {
      __room: 'visitor:' + userId // This is used to send to the relevant user's socket
    })

    bp.events.emit('guest.webchat.message', message)

    const user = await getOrCreateUser(userId)

    return bp.middlewares.sendIncoming(
      Object.assign(
        {
          platform: 'webchat',
          type: payload.type,
          user: user,
          text: sanitizedPayload.text,
          raw: {
            ...sanitizedPayload,
            conversationId
          }
        },
        payload.data
      )
    )
  }

  router.post(
    '/events/:userId',
    asyncApi(async (req, res) => {
      const { type, payload } = req.body || {}
      const { userId } = req.params || {}
      const user = await getOrCreateUser(userId)
      bp.middlewares.sendIncoming({
        platform: 'webchat',
        type,
        user,
        text: payload.text,
        raw: _.pick(payload, ['text', 'type', 'data']),
        ...payload.data
      })
      res.status(200).send({})
    })
  )

  router.post(
    '/conversations/:userId/:conversationId/reset',
    asyncApi(async (req, res) => {
      const { userId, conversationId } = req.params
      const user = await getOrCreateUser(userId)

      const payload = {
        text: `Reset the conversation`,
        type: 'session_reset'
      }

      await sendNewMessage(userId, conversationId, payload)
      await bp.dialogEngine.stateManager.deleteState(user.id)
      res.status(200).send({})
    })
  )

  router.post('/conversations/:userId/new', async (req, res) => {
    const { userId } = req.params

    await createConversation(userId)

    res.sendStatus(200)
  })

  router.get('/:userId/reference', async (req, res) => {
    try {
      const { params: { userId }, query: { ref: webchatUrlQuery } } = req
      const state = await bp.dialogEngine.stateManager.getState(userId)
      const newState = { ...state, webchatUrlQuery }

      await bp.dialogEngine.stateManager.setState(userId, newState)

      res.status(200)
    } catch (error) {
      res.status(500)
    }
  })

  const getMessageContent = message => {
    switch (message.message_type) {
      case 'file':
        return message.message_data.url
      case 'text':
        return message.message_text
      default:
        return `Event (${message.message_type})`
    }
  }

  const convertToTxtFile = async conversation => {
    const { messages } = conversation
    const user = await getUserProfile(conversation.userId)
    const timeFormat = 'MM/DD/YY HH:mm'

    const metadata = `Title: ${conversation.title}\r\nCreated on: ${moment(conversation.created_on).format(
      timeFormat
    )}\r\nUser: ${user.first_name} ${user.last_name}\r\n-----------------\r\n`

    const messagesAsTxt = messages.map(message => {
      if (message.message_type === 'session_reset') {
        return ''
      }

      return `[${moment(message.sent_on).format(timeFormat)}] ${message.full_name}: ${getMessageContent(message)}\r\n`
    })

    return [metadata, ...messagesAsTxt].join('')
  }

  router.get('/conversations/:userId/:conversationId/download/txt', async (req, res) => {
    const { userId, conversationId } = req.params || {}

    if (!validateUserId(userId)) {
      return res.status(400).send(ERR_USER_ID_REQ)
    }

    const conversation = await getConversation(userId, conversationId)
    const txt = await convertToTxtFile(conversation)

    res.send({ txt, name: `${conversation.title}.txt` })
  })

  return router
}
