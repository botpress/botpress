import AbstractAuthenticationProvider from '../provider'

export default class RootAuthentication extends AbstractAuthenticationProvider {
  async login(user, password, ip = 'all') {
    return {
      success: true,
      token: 'none'
    }
  }

  async authenticateWithError(authHeader) {
    return {
      id: 0,
      username: 'admin',
      email: 'admin@botpress.io',
      first_name: 'Admin',
      last_name: 'Admin',
      avatar_url: null,
      roles: ['admin']
    }
  }

  getAuthenticationInfo() {
    return {
      type: 'none'
    }
  }

  async refreshToken(authHeader) {
    const [scheme, token] = authHeader.split(' ')
    if (scheme.toLowerCase() !== 'bearer') {
      // only support Bearer scheme
      return {
        success: false,
        reason: `Wrong scheme ${scheme}, expected Bearer`
      }
    }

    // doesn't matter, can return the same token
    return {
      success: true,
      token
    }
  }

  async getUserIdentity(token) {
    return this.authenticateWithError('bearer ' + token)
  }

  async getJWTSecretOrCertificate() {
    return null
  }
}
