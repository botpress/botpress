import Promise from 'bluebird'

const debug = require('debug')('asyncMiddleware')

export const success = res => (message = 'Success', payload = {}) => {
  return res.json({
    status: 'success',
    message,
    payload
  })
}

export const error = res => (status = 400, code, message, docs) => {
  return res.status(status).json({
    status: 'error',
    type: 'Error',
    code: code || status,
    message: message || 'Unknown error',
    docs: docs || 'https://botpress.io/docs/cloud'
  })
}

export const asyncMiddleware = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(err => {
    debug('Async request error', err.message, err.stack)
    next(err)
  })
}
