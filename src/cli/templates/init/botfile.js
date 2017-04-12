module.exports = {

  /**
  * where the content is stored
  * you can access this property from `bp.dataLocation`
  */
  dataDir: process.env.BOTPRESS_DATA_DIR || './data',

  modulesConfigDir: process.env.BOTPRESS_CONFIG_DIR || './modules_config',
  disableFileLogs: false,
  port: process.env.BOTPRESS_PORT || process.env.PORT || 3000,
  optOutStats: false,
  notification: {
    file: 'notifications.json',
    maxLength: 50
  },
  log: {
    file: 'bot.log',
    maxSize: 1e6 // 1mb
  },

  /**
  * Access control of admin panel
  */
  login: {
    enabled: process.env.NODE_ENV === 'production',
    tokenExpiry: '6 hours',
    password: process.env.BOTPRESS_PASSWORD || 'password',
    maxAttempts: 3,
    resetAfter: 5 * 60 * 10000 // 5 minutes
  },

  /**
  * Postgres configuration
  */
  postgres: {
    enabled: process.env.DATABASE === 'postgres',
    host: process.env.PG_HOST || '127.0.0.1',
    port: process.env.PG_PORT || 5432,
    user: process.env.PG_USER || '',
    password: process.env.PG_PASSWORD || '',
    database: process.env.PG_DB || '',
    ssl: process.env.PG_SSL || false
  },

  /**
  * License configuration
  * By default, your bot is licensed under Botpress Proprietary License, you can change it for 'AGPL-3.0'
  * in your 'package.json' if you want to create an open-source chatbot. Otherwise, depending on the edition
  * you are using, you need to respect some criterias.
  */
  
  license: {
    edition: process.env.BOTPRESS_EDITION || 'community', //('community', 'pro', 'ultimate')
    id: process.env.BOTPRESS_LICENSE || ''
  }
}
