/**
 * Security Provider
 * @private
 * @module security
 */

export default class AbstractAuthenticationProvider {
  constructor(options) {
    Object.assign(this, options)
  }

  /**
   * @abstract
   * @description Login a user to the configured provider
   * @return {object} An authenticated User object or false if invalid login
   */
  login() {
    throw new Error('Abstract Class: Needs to be implemented')
  }

  /**
   * @abstract
   * @description Returns a fresh token from an old (but still active) token
   * @return {{ success: bool, token: string, reason: string }} A token object
   */
  refreshToken() {
    throw new Error('Abstract Class: Needs to be implemented')
  }

  /**
   * Authenticates a user from an authentication header
   * @description Example of header is: "bearer your_token_here"
   * @return {object} An authenticated User object or false if invalid login
   */
  async authenticate(authHeader) {
    try {
      return await this.authenticateWithError(authHeader)
    } catch (err) {
      this.logger.debug('[Login]', err.message)
      return false
    }
  }

  /**
   * @abstract
   */
  async authenticateWithError() {
    throw new Error('Abstract Class: Needs to be implemented')
  }

  /**
   * @abstract
   * @description Retrieve the user's identity from an authentication token
   * @return {object} An authenticated User object or false if invalid token
   */
  getUserIdentity() {
    throw new Error('Abstract Class: Needs to be implemented')
  }

  /**
   * @abstract
   * @description Returns information about the authentication provider and authentication status
   * @return {Object} Varies from provider to the other
   */
  getAuthenticationInfo() {
    throw new Error('Abstract Class: Needs to be implemented')
  }

  /**
   * @abstract
   * @description Returns a public JWT certificate or a private JWT key used to sign tokens and validate its origin
   * @return {String} The public certificate or private secret
   */
  getJWTSecretOrCertificate() {
    throw new Error('Abstract Class: Needs to be implemented')
  }
}
