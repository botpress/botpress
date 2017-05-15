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
    resetAfter: 10 * 60 * 1000 // 10 minutes
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
  * Please visit: https://botpress.io/license or contact us at contact@botpress.io
  */
  license: {
    // -> Update this if you bought a Botpress license <-
    // customerId: process.env.BOTPRESS_CUSTOMER_ID || '',
    // licenseKey: process.env.BOTPRESS_LICENSE_KEY || ''
  }
}
