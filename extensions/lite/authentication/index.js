import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import Promise from 'bluebird'

module.exports = ({ dataLocation, securityConfig }) => {
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
  const { maxAttempts, resetAfter } = securityConfig

  function attempt(ip) {
    // reset the cache if time elapsed
    if (new Date() - lastCleanTimestamp >= resetAfter) {
      attempts = {}
      lastCleanTimestamp = new Date()
    }

    return (attempts[ip] || 0) < maxAttempts
  }

  function authenticate(user, password, ip) {
    if (
      typeof user === 'string' &&
      user.toLowerCase() === 'admin' &&
      typeof password === 'string' &&
      password === adminPassword
    ) {
      attempts[ip] = 0
      return {
        id: 0,
        email: 'admin@botpress.io',
        first_name: 'Admin',
        last_name: 'Admin',
        avatar_url: null,
        roles: ['admin']
      }
    } else {
      attempts[ip] = (attempts[ip] || 0) + 1
      return null
    }
  }

  function getSecret() {
    return secret
  }

  function resetSecret() {
    return createNewSecret()
  }

  // Public API
  return {
    attempt: Promise.method(attempt),
    authenticate: Promise.method(authenticate),
    getSecret: Promise.method(getSecret),
    resetSecret: Promise.method(resetSecret)
  }
}
