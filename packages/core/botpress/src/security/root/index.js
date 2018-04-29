import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

import jwt from 'jsonwebtoken'

import AbstractAuthenticationProvider from '../provider'

export default class RootAuthentication extends AbstractAuthenticationProvider {
  constructor(options) {
    super(options)

    this._bootstrapToken()
    this.attempts = {}
  }

  _bootstrapToken() {
    let secret = ''
    const secretPath = path.join(this.dataLocation, 'secret.key')

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

    this.secret = secret
  }

  async _buildToken(loginUser) {
    return jwt.sign({ user: loginUser }, this.secret, {
      issuer: 'bot.root',
      expiresIn: this.securityConfig.tokenExpiry,
      algorithm: 'HS256'
    })
  }

  _attempt(ip) {
    const { maxAttempts, resetAfter } = this.securityConfig

    // reset the cache if time elapsed
    if (new Date() - this.lastCleanTimestamp >= resetAfter) {
      this.attempts = {}
      this.lastCleanTimestamp = new Date()
    }

    return (this.attempts[ip] || 0) < maxAttempts
  }

  async _login(user, password, ip = 'all') {
    const adminPassword = process.env.BOTPRESS_ADMIN_PASSWORD || this.securityConfig.password

    if (
      typeof user === 'string' &&
      user.toLowerCase() === 'admin' &&
      typeof password === 'string' &&
      password === adminPassword
    ) {
      this.attempts[ip] = 0
      return {
        id: 0,
        username: 'admin',
        email: 'admin@botpress.io',
        first_name: 'Admin',
        last_name: 'Admin',
        avatar_url: null,
        roles: ['admin']
      }
    } else {
      this.attempts[ip] = (this.attempts[ip] || 0) + 1
      return null
    }
  }

  async login(user, password, ip = 'all') {
    const canAttempt = this._attempt(ip)
    if (!canAttempt) {
      return { success: false, reason: 'Too many login attempts. Try again later.' }
    }

    const loginUser = await this._login(user, password, ip)

    if (loginUser) {
      return {
        success: true,
        token: await this._buildToken(loginUser)
      }
    } else {
      return {
        success: false,
        reason: 'Bad username / password'
      }
    }
  }

  async authenticateWithError(authHeader) {
    const [scheme, token] = (authHeader || 'invalid header').split(' ')

    if (scheme.toLowerCase() !== 'bearer') {
      throw new Error(`Wrong scheme ${scheme}, expected Bearer`)
    }

    const decoded = jwt.verify(token, this.secret, { algorithms: ['HS256'] })

    if (decoded.identity_proof_only) {
      return false
    }

    return decoded.user
  }

  getAuthenticationInfo() {
    return {
      type: 'root'
    }
  }

  async refreshToken(authHeader) {
    try {
      const loginUser = await this.authenticateWithError(authHeader)
      return {
        success: true,
        token: await this.buildToken(loginUser)
      }
    } catch (err) {
      return {
        success: false,
        reason: err.message || 'The token is invalid or expired'
      }
    }
  }

  async getUserIdentity(token) {
    return this.authenticateWithError('bearer ' + token)
  }

  async getJWTSecretOrCertificate() {
    return this.secret
  }
}
