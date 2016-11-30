import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'

/**
 * Security helper for botpress
 *
 * Constructor of following functions
 *
 *   - login(user, password, ip)
 *   - authenticate(token)
 *   - getSecret()
 *
 * It will find or create a secret.key in `dataLocation`, then setup the adminPassword for user login.
 *
 * NOTE: current only valid user name is "admin"
 */
module.exports = (dataLocation, securityConfig) => {

  // reading secret from data or creating new secret
  let secret = ''
  const secretPath = path.join(dataLocation, 'secret.key')

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
  }

  const adminPassword = process.env.BOTPRESS_ADMIN_PASSWORD || securityConfig.password

  // a per-ip cache that logs login attempts
  let attempts = {}
  let lastCleanTimestamp = new Date()
  const {maxAttempts, resetAfter, tokenExpiry} = securityConfig

  // login function that returns a {success, reason, token} object
  // accounts for number of bad attempts
  const login = function(user, password, ip = 'all') {
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
        token: jwt.sign({ user: 'admin' }, secret, { expiresIn: tokenExpiry })
      }
    } else {
      attempts[ip] = (attempts[ip] || 0) + 1
      return {
        success: false,
        reason: 'bad user/password combination'
      }
    }
  }

  /**
   * @param {string} token
   * @return {boolean} whether the token is valid
   */
  const authenticate = function(token) {
    try {
      const decoded = jwt.verify(token, secret)
      return decoded.user === 'admin'
    } catch (err) {
      return false
    }
  }

  /**
   * Get secret key
   *
   * @return {string}
   */
  const getSecret = () => secret

  return {
    login,
    authenticate,
    getSecret
  }
}
