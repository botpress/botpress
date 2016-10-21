import winston from 'winston'
import path from 'path'
import Promise from 'bluebird'
import moment from 'moment'

import  { isDeveloping } from './util'



module.exports = (skin) => {
  const logFile = path.join(skin.dataLocation, skin.botfile.log.file)
  
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
    logger.add(winston.transports.File, {
      filename: logFile,
      maxsize: skin.botfile.log.maxSize
    })
  }

  logger.archiveToFile = () => {
    return Promise.resolve(logFile)
  }

  return logger
}
