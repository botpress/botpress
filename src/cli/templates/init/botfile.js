
module.exports = {

  /**
  * where the content is stored
  * you can access this property from `bp.dataLocation`
  */
  dataDir: process.env.BOTPRESS_DATA_DIR || "./data",

  modulesConfigDir: process.env.BOTPRESS_CONFIG_DIR || "./modules_config",
  disableFileLogs: false,
  port: process.env.BOTPRESS_PORT || 3000,
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
    tokenExpiry: "6 hours",
    password: process.env.BOTPRESS_PASSWORD || "password",
    maxAttempts: 3,
    resetAfter: 5 * 60 * 10000 // 5 minutes
  }
}
