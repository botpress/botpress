import umm from './umm'
import api from './api'
import socket from './socket'
import db from './db'

exports.onInit = async bp => {
  bp.console.debug('[webchat] On Init')

  const middleware = {
    name: 'Test slack message',
    description: 'Receive a message from slack',
    order: 20,
    handler: (event, next) => {
      if (event.type === 'slack') {
        bp.dialog.processEvent('slack_user_id', event)
      }
    },
    direction: 'incoming'
  }
  await bp.events.load([middleware])

  const event = {
    type: 'slack',
    channel: 'web',
    target: 'slack_channel_id',
    direction: 'incoming'
  }
  await bp.events.sendIncoming(event)
}

exports.onReady = async bp => {
  bp.console.debug('[webchat] On Ready')
}

exports.config = {
  uploadsUseS3: { type: 'bool', required: false, default: false, env: 'WEBCHAT_USE_S3' },
  uploadsS3Bucket: { type: 'string', required: false, default: 'bucket-name', env: 'WEBCHAT_S3_BUCKET' },
  uploadsS3AWSAccessKey: { type: 'any', required: false, default: null, env: 'WEBCHAT_S3_ACCESS_KEY' },
  uploadsS3Region: { type: 'any', required: false, default: null, env: 'WEBCHAT_S3_REGION' },
  uploadsS3AWSAccessSecret: { type: 'any', required: false, default: null, env: 'WEBCHAT_S3_KEY_SECRET' },
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

exports.defaultConfigJson = `
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
