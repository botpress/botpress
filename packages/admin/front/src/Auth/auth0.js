import Auth0 from 'auth0-js'

import history from '../history'
import BaseAuth from './base'
import { AUTH_CONFIG } from './auth0-variables'

const auth0 = new Auth0.WebAuth({
  domain: AUTH_CONFIG.domain,
  clientID: AUTH_CONFIG.clientId,
  redirectUri: AUTH_CONFIG.callbackUrl,
  audience: `https://${AUTH_CONFIG.domain}/userinfo`,
  responseType: 'token id_token',
  scope: 'openid'
})

export default class Auth0Authentication extends BaseAuth {
  doLogin({ state, connection }) {
    sessionStorage.setItem('preauth_state', JSON.stringify(state))
    auth0.authorize({
      connection: connection,
      state: encodeURI(JSON.stringify(state))
    })
  }

  handleAuthentication = () => {
    const hash = window.location.hash

    if (!/state=/i.test(hash)) {
      return this.handlePostLimitedSAMLAuthentication()
    }

    auth0.parseHash(async (err, authResult) => {
      /****
        Error handling
      ****/

      if (err) {
        history.replace('/home')
        return console.log('Login error: ', err)
      }

      const state = authResult && authResult.state && JSON.parse(decodeURI(authResult.state))

      /*****
        CSRF Attack Verification
      *****/

      let csrfVerified = false

      if (state && state.csrfCode) {
        csrfVerified = state.csrfCode === localStorage.getItem('auth_csrfCode')
      }

      if (!csrfVerified) {
        history.replace('/home')
        return alert('CSRF Attack Attempt Blocked')
      }

      localStorage.removeItem('auth_csrfCode')

      /****
        Authentication logic
      ****/

      if (authResult && authResult.accessToken && authResult.idToken) {
        this.setSession(authResult)
      } else {
        history.replace('/home') // TODO Handle authentication error
      }

      await this.handlePostAuthentication(state)
    })
  }
}
