import winston from 'winston'
import path from 'path'
import Promise from 'bluebird'
import moment from 'moment'

import  { isDeveloping } from './util'

module.exports = (bp) => {
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
    const logFile = path.join(bp.dataLocation, bp.botfile.log.file)

    logger.add(winston.transports.File, {
      filename: logFile,
      maxsize: bp.botfile.log.maxSize
    })
  }

  logger.archiveToFile = () => {
    const logFile = path.join(bp.dataLocation, bp.botfile.log.file)

    return Promise.resolve(logFile)
  }

  return logger
}
