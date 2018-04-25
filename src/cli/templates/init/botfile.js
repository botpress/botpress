const yn = require('yn')
const isProd = process.env.NODE_ENV === 'production'
const port = process.env.BOTPRESS_PORT || process.env.PORT || 3000
const botUrl = process.env.BOTPRESS_URL || 'http://localhost:' + port

/**
 * @class Botfile
 */
const botfile = {
  /**
   * The bot's base URL where the bot is reachable from the internet
   * @memberof Botfile#
   */
  botUrl: botUrl,

  /**
    The botpress environment, useful to disambiguate multiple 
    instances of the same bot running in different environments.
    e.g. "dev", "staging", "production"
    @memberof Botfile#
   */
  env: process.env.BOTPRESS_ENV || 'dev',

  /**
    The port on which the API and UI will be available
    @memberof Botfile#
   */
  port: port,

  /**
    Where the content is stored
    You can access this property from `bp.dataLocation`
    @memberof Botfile#
  */
  dataDir: process.env.BOTPRESS_DATA_DIR || './data',

  /**
    Some modules might generate static configuration files
    @memberof Botfile#
   */
  modulesConfigDir: process.env.BOTPRESS_CONFIG_DIR || './modules_config',

  /**
    Path to Content Types
    @memberof Botfile#
   */
  contentDir: './content',

  /**
    Path to Flows
    @memberof Botfile#
   */
  flowsDir: './flows',

  /**
    Path to Content Types Data
    @memberof Botfile#
   */
  contentDataDir: './content_data',

  /**
    Path to media / file uploads
    @memberof Botfile#
   */
  mediaDir: './media',

  /**
    By default logs are enabled and available in `dataDir`
    @memberof Botfile#
    @type {Object}
   */
  disableFileLogs: false,
  log: {
    file: 'bot.log',
    maxSize: 1e6 // 1mb
  },

  /**
    The web server API config
    @memberof Botfile#
   */
  api: {
    bodyMaxSize: '1mb'
  },

  /**
    Dialog Manager (DM) options
    @memberof Botfile#
    @type {Object}
  */
  dialogs: {
    timeoutInterval: '15m',
    janitorInterval: '10s'
  },

  /**
    Botpress collects some anonymous usage statistics to help us put our efforts at the right place
    @memberof Botfile#
   */
  optOutStats: false,

  /**
    Where the notifications are stored.
    @memberof Botfile#
    @type {Object}
   */
  notification: {
    file: 'notifications.json',
    maxLength: 50
  },

  /**
    By default ghost content management is only activated in production
    @memberof Botfile#
    @type {Object}
   */
  ghostContent: {
    enabled: process.env.NODE_ENV === 'production' || process.env.BOTPRESS_GHOST_ENABLED
  },

  /**
    Access control of admin panel
    @memberof Botfile#
    @type {Object}
  */
  login: {
    enabled: process.env.NODE_ENV === 'production',
    useCloud: yn(process.env.BOTPRESS_CLOUD_ENABLED || 'true'),
    tokenExpiry: '6 hours',
    password: process.env.BOTPRESS_PASSWORD || 'password',
    maxAttempts: 3,
    resetAfter: 10 * 60 * 1000 // 10 minutes
  },

  /**
    Postgres configuration
    If Postgres is not enabled, Botpress uses SQLite 3 (file-based database)
    @memberof Botfile#
    @type {Object}
  */
  postgres: {
    enabled: process.env.DATABASE === 'postgres',
    connection: process.env.DATABASE_URL,
    host: process.env.PG_HOST || '127.0.0.1',
    port: process.env.PG_PORT || 5432,
    user: process.env.PG_USER || '',
    password: process.env.PG_PASSWORD || '',
    database: process.env.PG_DB || '',
    ssl: process.env.PG_SSL || false
  },

  middleware: {
    /*
      By default Botpress will automatically load all the middlewares before starting your bot
      If this is set to false, you should call `bp.middlewares.load` manually
     */
    autoLoading: true
  },

  // **** Update this if you bought a Botpress license ****
  license: {
    // customerId: process.env.BOTPRESS_CUSTOMER_ID || 'your_customer_id_here',
    // licenseKey: process.env.BOTPRESS_LICENSE_KEY || 'your_key_here'
  }
}

module.exports = botfile
