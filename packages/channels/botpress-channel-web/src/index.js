import umm from './umm'
import api from './api'
import socket from './socket'
import db from './db'

module.exports = {
  config: {
    uploadsUseS3: { type: 'bool', required: false, default: false, env: 'WEBCHAT_USE_S3' },
    uploadsS3Bucket: { type: 'string', required: false, default: 'bucket-name', env: 'WEBCHAT_S3_BUCKET' },
    uploadsS3Region: { type: 'any', required: false, default: null, env: 'WEBCHAT_S3_REGION' },
    uploadsS3AWSAccessKey: { type: 'any', required: false, default: null, env: 'WEBCHAT_S3_ACCESS_KEY' },
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
  },

  init: async function(bp, configurator) {
    const config = await configurator.loadAll()

    bp.webchat = {}

    // Setup the socket events
    await socket(bp, config)

    // Initialize UMM
    return umm(bp)
  },

  ready: async function(bp, configurator) {
    const config = await configurator.loadAll()

    // Initialize the database
    const knex = await bp.db.get()
    db(knex, config).initialize()

    // Setup the APIs
    await api(bp, config)
  }
}
