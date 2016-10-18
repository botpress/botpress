const winston = require('winston')
const path = require('path')
const Promise = require('bluebird')
const moment = require('moment')

const { isDeveloping } = require('./util')

module.exports = (skin) => {
  const logger = new winston.Logger({
    level: isDeveloping ? 'debug' : 'info',
    transports: [
      new (winston.transports.Console)({
        prettyPrint: true,
        colorize: true,
        timestamp: () => moment().format('HH:mm:ss')
      })
    ]
  })

  logger.enableFileTransport = () => {
    const logFile = path.join(skin.dataLocation, 'skin.log')

    logger.add(winston.transports.File, {
      filename: logFile,
      maxsize: 1e6, // TODO 1mb, make this a config
    })
  }

  logger.archiveToFile = () => Promise.resolve(logFile)

  return logger
}
