import { BotpressAPI, BotpressEvent, MiddlewareDefinition } from 'botpress-module-sdk'

import api from './api'
import db from './db'
import socket from './socket'
import umm from './umm'

// TODO
// [x] users.js
//    [] Core users <--> channels API
// [] api.js
//    [] Core createRouter --> ExpressRouter
// [] db.js
// [] inject.js
// [] socket.js
//    [] Core EventBus (socket.io, per-bot channels)
// [] umm.js
//    [] Core EventLifecycle (status('sent'))
//    [] Core EventLifecycle (waitStatus(eventId, 'sent'))
//    [] Core new SyntheticEvent() (TimeoutEvent, TimerEvent, CustomEvent, BroadcastEvent)
//    [] Core schedule(event, dateTime)
//    [] Core sendImmediate(event)
// [] util.js

export type Extension = {
  webchat: {}
}

export const onInit = async (bp: BotpressAPI & Extension) => {
  bp.logger.debug('[webchat] On Init')
  bp.webchat = {}

  // await socket(bp)
  // await umm(bp)
  // await api(bp)
  // await db(bp).initialize()

  // const config = await bp.config.getModuleConfig('webchat')

  const middleware: MiddlewareDefinition = {
    name: 'slack.in',
    description: 'Receive a message from slack',
    order: 20,
    handler: (event, next) => {
      if (event.type === 'slack') {
        bp.dialog.processMessage('PENIS', event)
      }
    },
    direction: 'incoming'
  }

  await bp.events.registerMiddleware(middleware)

  const event: BotpressEvent = {
    type: 'slack',
    channel: 'web',
    target: 'slack_channel_id',
    direction: 'incoming'
  }

  await bp.events.sendEvent(event)
}

export const onReady = async bp => {
  bp.logger.debug('[webchat] On Ready')
}

export const config = {
  uploadsUseS3: { type: 'bool', required: false, default: false, env: 'WEBCHAT_USE_S3' },
  uploadsS3Bucket: { type: 'string', required: false, default: 'bucket-name', env: 'WEBCHAT_S3_BUCKET' },
  uploadsS3AWSAccessKey: { type: 'any', required: false, default: undefined, env: 'WEBCHAT_S3_ACCESS_KEY' },
  uploadsS3Region: { type: 'any', required: false, default: undefined, env: 'WEBCHAT_S3_REGION' },
  uploadsS3AWSAccessSecret: { type: 'any', required: false, default: undefined, env: 'WEBCHAT_S3_KEY_SECRET' },
  startNewConvoOnTimeout: {
    type: 'bool',
    required: false,
    default: false,
    env: 'WEBCHAT_START_NEW_CONVO_ON_TIMEOUT'
  },
  recentConversationLifetime: {
    type: 'any',
    required: false,
    default: '6 hours',
    env: 'WEBCHAT_RECENT_CONVERSATION_LIFETIME'
  }
}

export const defaultConfigJson = `
{
  /************
    Optional settings
  *************/

  "uploadsUseS3": false,
  "uploadsS3Bucket": "bucket-name",
  "uploadsS3Region": "eu-west-1",
  "uploadsS3AWSAccessKey": "your-aws-key-name",
  "uploadsS3AWSAccessSecret": "secret-key",
  "startNewConvoOnTimeout": false,
  "recentConversationLifetime": "6 hours"
}
`
