/**
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

import moment from 'moment'
import ms from 'ms'
import winston from 'winston'
import Promise from 'bluebird'

import { isDeveloping } from '../util'
import DbTransport from './db-transport'

module.exports = logConfig => {
  let _db = null

  const logger = new winston.Logger({
    level: process.env.LOG_LEVEL ? process.env.LOG_LEVEL.toLowerCase() : isDeveloping ? 'debug' : 'info',
    transports: [
      new winston.transports.Console({
        prettyPrint: true,
        colorize: true,
        timestamp: () => moment().format('HH:mm:ss')
      })
    ]
  })

  logger.enableDbStorageIfNeeded = ({ db, janitor }) => {
    if (logConfig.enabled) {
      _db = db
      const ttl = ms(`${logConfig.keepDays || 30}days`)
      logger.add(DbTransport, { ttl, db, janitor })
    }
  }

  logger.queryDb = (limit, order) => {
    if (!logConfig.enabled) {
      return Promise.resolve([])
    }
    return DbTransport._query(_db, limit, order)
  }

  return logger
}
