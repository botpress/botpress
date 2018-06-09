import jwt from 'jsonwebtoken'

import AbstractAuthenticationProvider from '../provider'

export default class CloudAuthentication extends AbstractAuthenticationProvider {
  constructor(options) {
    super(options)

    const { botId } = this.cloud.getPairingInfo() || {}

    this.botId = botId
    this.botEnv = this.cloud.getBotEnv()
    this.endpoint = this.cloud.getCloudEndpoint()
  }

  async login() {
    return { success: false, reason: 'Root authentication is disabled when using Botpress Cloud [BPCLOUDERR]' }
  }

  getAuthenticationInfo() {
    return {
      type: 'cloud',
      botId: this.botId,
      botEnv: this.botEnv,
      endpoint: this.endpoint
    }
  }

  async authenticateWithError(authHeader, allowProof = false) {
    if (!authHeader) {
      throw new Error('Missing auth header')
    }

    const [scheme, token] = authHeader.split(' ')

    if (scheme.toLowerCase() !== 'bearer') {
      throw new Error(`Wrong scheme '${scheme}', expected Bearer`)
    }

    const secret = await this.cloud.getCertificate()
    const algorithm = 'RS256'

    const decoded = jwt.verify(token, secret, { algorithms: [algorithm] })

    if (!allowProof && decoded.identity_proof_only) {
      return false
    }

    if (decoded.aud !== `urn:bot/${this.botId}`) {
      return false
    }

    return decoded.user
  }

  async refreshToken(authHeader) {
    const [scheme, token] = authHeader.split(' ')
    if (scheme.toLowerCase() !== 'bearer') {
      // only support Bearer scheme
      return {
        success: false,
        reason: `Wrong scheme '${scheme}', expected Bearer`
      }
    }

    // doesn't matter, can return the same token
    return {
      success: true,
      token
    }
  }

  async getUserIdentity(token) {
    return this.authenticateWithError('bearer ' + token, true)
  }

  async getJWTSecretOrCertificate() {
    return this.cloud.getCertificate()
  }
}
