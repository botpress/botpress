const winston = require('winston')
const path = require('path')

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
        maxsize: 100000,
        maxFiles: 10
      })
    ]
  })

  return logger
}
