module.exports = {
  dataDir: "./data",
  configModulesDir: "./config_modules",
  disableFileLogs: false,
  notification: {
    file: 'notifications.json',
    maxLength: 50
  },
  log: {
    file: 'bot.log',
    maxSize: 1e6 // 1mb
  },
  login: {
    enabled: true,
    tokenExpiry: "6 hours",
    password: "password",
    maxAttempts: 3,
    resetAfter: 5 * 60 * 10000 // 5 minutes
  }
}
