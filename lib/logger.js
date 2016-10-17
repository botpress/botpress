const winston = require('winston')
const path = require('path')
const Promise = require('bluebird')

const { isDeveloping } = require('./util')

module.exports = () => {
  const logFile = path.join(__dirname, '..', 'data', 'skin.log') // TODO Put that in config

  const logger = new winston.Logger({
    level: isDeveloping ? 'debug' : 'info',
    transports: [
      new (winston.transports.Console)({
        prettyPrint: true,
        colorize: true,
        timestamp: false
      }),
      new (winston.transports.File)({
        filename: logFile,
        maxsize: 1e6, // TODO 1mb, make this a config
      })
    ]
  })

  logger.archiveToFile = () => Promise.resolve(logFile)

  return logger
}
