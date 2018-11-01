import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import fs from 'fs'
import path from 'path'

import api from './api'
import WebchatDatabase from './db'
import socket from './socket'

export type Extension = {
  'channel-web': {}
}

export type SDK = typeof sdk & Extension

const onServerStarted = async (bp: SDK) => {
  bp['channel-web'] = {}

  const db = new WebchatDatabase(bp)
  await db.initialize()

  await api(bp, db)
  await socket(bp, db)
}

const onServerReady = async (bp: SDK) => {}

const config: sdk.ModuleConfig = {
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

const defaultConfigJson = `
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

const serveFile = async (filePath: string): Promise<Buffer> => {
  filePath = filePath.toLowerCase()

  const mapping = {
    'index.js': path.join(__dirname, '../web/web.bundle.js'),
    'embedded.js': path.join(__dirname, '../web/embedded.bundle.js'),
    'fullscreen.js': path.join(__dirname, '../web/fullscreen.bundle.js')
  }

  // Web views
  if (mapping[filePath]) {
    return fs.readFileSync(mapping[filePath])
  }

  return Buffer.from('')
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  config,
  defaultConfigJson,
  serveFile,
  definition: {
    name: 'channel-web',
    menuIcon: 'chrome_reader_mode',
    fullName: 'Web Chat',
    homepage: 'https://botpress.io',
    noInterface: true,
    plugins: [{ entry: 'WebBotpressUIInjection', position: 'overlay' }]
  }
}

export default entryPoint
