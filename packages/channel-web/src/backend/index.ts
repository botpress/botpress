import 'bluebird-global'
import { BotpressAPI, BotpressEvent, MiddlewareDefinition } from 'botpress-module-sdk'
import fs from 'fs'
import path from 'path'

import api from './api'
import WebchatDatabase from './db'
import OutgoingHandler from './outgoing'
import socket from './socket'
import umm from './umm'

// TODO
// [x] users.js
//    [X] Core users <--> channels API
// [X] api.js
//    [X] Core createRouter --> ExpressRouter
// [X] db.js
// [X] inject.js
// [X] socket.js
//    [] Core EventBus (socket.io, per-bot channels)
// [] umm.js
//    [] Core EventLifecycle (status('sent'))
//    [] Core EventLifecycle (waitStatus(eventId, 'sent'))
//    [] Core new SyntheticEvent() (TimeoutEvent, TimerEvent, CustomEvent, BroadcastEvent)
//    [] Core schedule(event, dateTime)
//    [] Core sendImmediate(event)
// [] util.js
// [] Core API
//    Serve the module's view(s)
//    Inject the module's view(s) – overlay

export type Extension = {
  'channel-web': {}
}

export const onInit = async (bp: BotpressAPI & Extension) => {
  bp.logger.debug('Init')
  bp['channel-web'] = {}

  const db = new WebchatDatabase(bp)
  await db.initialize()

  await api(bp, db)
  await socket(bp, db)
  await umm(bp)

  bp.events.registerOutgoingChannelHandler(new OutgoingHandler())
}

export const onReady = async bp => {
  bp.logger.debug('Ready')
}

export const config = {
  uploadsUseS3: { type: 'bool', required: false, default: false, env: 'CHANNEL_WEB_USE_S3' },
  uploadsS3Bucket: { type: 'string', required: false, default: 'bucket-name', env: 'CHANNEL_WEB_S3_BUCKET' },
  uploadsS3AWSAccessKey: { type: 'any', required: false, default: undefined, env: 'CHANNEL_WEB_S3_ACCESS_KEY' },
  uploadsS3Region: { type: 'any', required: false, default: undefined, env: 'CHANNEL_WEB_S3_REGION' },
  uploadsS3AWSAccessSecret: { type: 'any', required: false, default: undefined, env: 'CHANNEL_WEB_S3_KEY_SECRET' },
  startNewConvoOnTimeout: {
    type: 'bool',
    required: false,
    default: false,
    env: 'CHANNEL_WEB_START_NEW_CONVO_ON_TIMEOUT'
  },
  recentConversationLifetime: {
    type: 'any',
    required: false,
    default: '6 hours',
    env: 'CHANNEL_WEB_RECENT_CONVERSATION_LIFETIME'
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

export const serveFile = async (filePath: string): Promise<Buffer> => {
  filePath = filePath.toLowerCase()

  const mapping = {
    'index.js': path.join(__dirname, '../web/web.bundle.js'),
    'embedded.js': path.join(__dirname, '../web/embedded.bundle.js'),
    'fullscreen.js': path.join(__dirname, '../web/fullscreen.bundle.js'),
    'inject.js': path.join(__dirname, './inject.js')
  }

  // Web views
  if (mapping[filePath]) {
    return fs.readFileSync(mapping[filePath])
  }

  return new Buffer('')
}
