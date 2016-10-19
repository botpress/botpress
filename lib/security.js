const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')

const util = require('./util')

module.exports = (skin) => {

  // reading secret from data or creating new secret
  let secret = ''
  const secretPath = path.join(skin.dataLocation, 'secret.key')

  const createNewSecret = () => {
    secret = crypto.randomBytes(256).toString()
    fs.writeFileSync(secretPath, secret)
    return secret
  }

  if (fs.existsSync(secretPath)) {
    secret = fs.readFileSync(secretPath)
  }

  if (!secret || secret.length < 15) {
    secret = createNewSecret()
    skin.logger.warn('current secret wasn\'t safe enough, created a new one')
  }

  const adminPassword = process.env.SKIN_ADMIN_PASSWORD ||
    (skin.botfile.login && skin.botfile.login.password) ||
    'password'

  const enabled = skin.requiresAuth =
    (skin.botfile.login && skin.botfile.login.enabled) &&
    !util.isDeveloping

  // a per-ip cache that logs login attempts
  let attempts = {}
  let lastCleanTimestamp = new Date()
  const maxAttempts = (skin.botfile.login && skin.botfile.login.maxAttempts) || 3
  const resetAfter = (skin.botfile.login && skin.botfile.login.resetAfter) || 5 * 60 * 1000 // 5mins

  const loginTokenExpiry = (skin.botfile.login && skin.botfile.login.tokenExpiry) || '6 hours'

  // login function that returns a {success, reason, token} object
  // accounts for number of bad attempts
  skin.login = function(user, password, ip = 'all') {
    // reset the cache if time elapsed
    if (new Date() - lastCleanTimestamp >= resetAfter) {
      attempts = {}
      lastCleanTimestamp = new Date()
    }

    if (attempts[ip] >= maxAttempts) {
      return {
        success: false,
        reason: 'too many login attempts, try again later'
      }
    }

    if (typeof(user) === 'string' && user.toLowerCase() === 'admin' &&
      typeof(password) === 'string' && password === adminPassword) {
      attempts[ip] = 0
      return {
        success: true,
        token: jwt.sign({
          user: 'admin',
          expiresIn: loginTokenExpiry
        }, secret)
      }
    } else {
      attempts[ip] = (attempts[ip] || 0) + 1
      return {
        success: false,
        reason: 'bad user/password combination'
      }
    }
  }

  skin.authenticate = function(token) {
    try {
      const decoded = jwt.verify(token, secret)
      return decoded.user === 'admin'
    } catch(err) {
      return false
    }
  }

  skin.getSecret = () => secret
}
