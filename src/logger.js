/**
 * The complete Triforce, or one or more components of the Triforce.
 * @typedef {Function} Logger~MessageLogger
 * @param {String} message Message to log
 * @param {...Object} objects Additional objects to log
 */

/**
 * @class Logger
 * @prop {Logger~MessageLogger} debug Logs message for debugging purposes
 * (hidden in production by default, see {@link Botfile} to change this)
 * @prop {Logger~MessageLogger} info Logs informative messages (shown in production)
 * @prop {Logger~MessageLogger} warn Logs warning messages (shown in production)
 * @prop {Logger~MessageLogger} error Logs error messages (shown in production)
 */

import winston from 'winston'
import path from 'path'
import Promise from 'bluebird'
import moment from 'moment'

import { isDeveloping } from './util'

module.exports = (dataLocation, logConfig) => {
  const logger = new winston.Logger({
    level: isDeveloping ? 'debug' : 'info',
    transports: [
      new winston.transports.Console({
        prettyPrint: true,
        colorize: true,
        timestamp: () => moment().format('HH:mm:ss')
      })
    ]
  })

  logger.enableFileTransport = () => {
    const logFile = path.join(dataLocation, logConfig.file)
    logger.add(winston.transports.File, {
      filename: logFile,
      maxsize: logConfig.maxSize
    })
  }

  logger.archiveToFile = () => {
    const logFile = path.join(dataLocation, logConfig.file)

    return Promise.resolve(logFile)
  }

  if (!logConfig.disableFileLogs) {
    logger.enableFileTransport()
  }

  return logger
}
