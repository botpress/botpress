module.exports = {

  /**
   * where the content is stored
   * you can access this property from `bp.dataLocation`
   */
  dataDir: "./data",

  modulesConfigDir: "./modules_config",
  disableFileLogs: false,
  notification: {
    file: 'notifications.json',
    maxLength: 50
  },
  log: {
    file: 'bot.log',
    maxSize: 1e6 // 1mb
  },

  /**
   * Access control of admin pabel
   */
  login: {
    enabled: process.env.NODE_ENV === 'production',
    tokenExpiry: "6 hours",
    password: "password",
    maxAttempts: 3,
    resetAfter: 5 * 60 * 10000 // 5 minutes
  }
}
