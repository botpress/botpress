import jwt from 'jsonwebtoken'
import _ from 'lodash'

import Authentication from '+/authentication'

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
 */

module.exports = ({ dataLocation, securityConfig, db }) => {
  const authentication = Authentication({ dataLocation, securityConfig, db })
  const { tokenExpiry } = securityConfig

  // login function that returns a {success, reason, token} object
  // accounts for number of bad attempts
  const login = async (user, password, ip = 'all') => {
    const canAttempt = await authentication.attempt(ip)
    if (!canAttempt) {
      return { success: false, reason: 'Too many login attempts. Try again later.' }
    }

    const loginUser = await authentication.authenticate(user, password, ip)

    if (loginUser) {
      const secret = await authentication.getSecret()

      return {
        success: true,
        token: jwt.sign({ user: loginUser }, secret, { expiresIn: tokenExpiry })
      }
    } else {
      return {
        success: false,
        reason: 'Bad username / password'
      }
    }
  }

  /**
   * @param {string} token
   * @return {boolean} whether the token is valid
   */
  const authenticate = async token => {
    try {
      const secret = await authentication.getSecret()
      const decoded = jwt.verify(token, secret)
      const verified = authentication.verifyUser ? await authentication.verifyUser(decoded) : true
      return verified && decoded.user
    } catch (err) {
      return false
    }
  }

  return {
    login,
    authenticate,
    getSecret: authentication.getSecret,
    _authentication: authentication
  }
}
