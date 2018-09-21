const port = process.env.BOTPRESS_PORT || process.env.PORT || 3000
const botUrl = process.env.BOTPRESS_URL || `http://localhost:${port}`

module.exports = {
  /*
    Botpress minimal supported version.
    Don't forget to change it when updating to the next major version.
   */
  version: '<%= version %>',

  /*
    The bot's base URL where the bot is reachable from the internet
   */
  botUrl: botUrl,

  /*
    The botpress environment, useful to disambiguate multiple
    instances of the same bot running in different environments.
    e.g. "dev", "staging", "production"
   */
  env: process.env.BOTPRESS_ENV || 'dev',

  /*
    The port on which the API and UI will be available
   */
  port: port,

  /*
    The IP address which API will listen to (optional)
   */
  hostname: process.env.BOTPRESS_HOSTNAME,

  /*
    Where the content is stored
    You can access this property from `bp.dataLocation`
  */
  dataDir: process.env.BOTPRESS_DATA_DIR || './.data',

  /*
    Some modules might generate static configuration files
   */
  modulesConfigDir: process.env.BOTPRESS_CONFIG_DIR || './config',

  /*
    Path to Content Types
   */
  contentDir: './src/content',

  /*
    Path to Flows
   */
  flowsDir: './generated/flows',

  /*
    Path to Content Types Data
   */
  contentDataDir: './generated/content',

  /*
    Path to media / file uploads
   */
  mediaDir: './generated/media',

  /*
    By default logs are enabled and stored in the DB. 
    Silent mode prevents logs from being displayed in the console
   */
  logs: {
    enabled: true,
    keepDays: 30,
    silentMode: false
  },

  /*
    The web server API config
   */
  api: {
    bodyMaxSize: '1mb'
  },

  /*
    Dialog Manager (DM)
  */
  dialogs: {
    timeoutInterval: '2m',
    janitorInterval: '10s'
  },

  /*
    Botpress collects some anonymous usage statistics to help us put our efforts at the right place
   */
  optOutStats: false,

  /*
    By default ghost content management is only activated in production
   */
  ghostContent: {
    enabled: process.env.NODE_ENV === 'production' || process.env.BOTPRESS_GHOST_ENABLED
  },

  heroSection: {
    hidden: false
  },

  /*
    Access control of admin panel
  */
  login: {
    enabled: process.env.NODE_ENV === 'production',
    useCloud: process.env.BOTPRESS_CLOUD_ENABLED,
    tokenExpiry: '6 hours',
    password: process.env.BOTPRESS_PASSWORD || 'password',
    maxAttempts: 3,
    resetAfter: 10 * 60 * 1000 // 10 minutes
  },

  /*
    Postgres configuration
    If Postgres (>= 9.5) is not enabled, Botpress uses SQLite 3 (file-based database)
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

  /* 
    This secret key will be used by the encryption / decryption feature. 
    If left undefined, a new one will be generated each time the bot is started.
    The key must be 32 characters long.
  */
  secretKey: null,

  /*
    Prevents Botpress from creating worker threads
   */
  disableClusterMode: false
}
