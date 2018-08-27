import nanoid from 'nanoid'
// import qs from 'query-string'
import _ from 'lodash'
import moment from 'moment'

import history from '../history'
// import api from '../api'

export default class BaseAuth {
  login = async ({
    comingFrom = '',
    connection = null,
    callbackPath = '',
    action = '',
    botId = '0',
    env = 'dev',
    params = '',
    credentials
  } = {}) => {
    const csrfCode = nanoid()
    localStorage.setItem('auth_csrfCode', csrfCode)

    const state = {
      csrfCode: csrfCode,
      botId: botId,
      env: env,
      action: action,
      callbackPath: callbackPath,
      params: params,
      comingFrom: comingFrom,
      expiresAt: moment()
        .add('10', 'minutes')
        .format('x')
    }

    if (this.isAuthenticated()) {
      await this.handlePostAuthentication(state)
    } else {
      await this.doLogin({ state, connection, csrfCode, credentials })
    }
  }

  doLogin() {
    throw new Error('Abstract method: Not Implemented')
  }

  handlePostAuthentication = async state => {
    // TODO: cleanup
    console.error('handlePostAuthentication is not expected to be called')
    return

    // const params = {
    //   botId: state.botId,
    //   env: state.env
    // }

    // try {
    //   const { data } = await api.getSecured().get('/api/login/' + state.action, {
    //     params: params
    //   })

    //   /****
    //     Redirect logic:
    //       - If "action=redirect" is specified, redirect to the "botId"'s url
    //       - if "action=callback" is specified, ask user permission to provide identity to botId's url
    //   ****/

    //   const { payload = {} } = data

    //   if (payload.action === 'redirect') {
    //     const { botUrl, token } = payload

    //     if (botUrl) {
    //       const finalUrl =
    //         botUrl +
    //         '?' +
    //         qs.stringify({
    //           token: token,
    //           botId: state.botId,
    //           params: state.params
    //         })

    //       return (window.location.href = finalUrl)
    //     }
    //   } else if (payload.action === 'callback') {
    //     return history.replace({
    //       pathname: '/callback-grant',
    //       search:
    //         '?' +
    //         qs.stringify({
    //           botName: payload.botName,
    //           identity: payload.identity,
    //           url: payload.botUrl + state.callbackPath
    //         })
    //     })
    //   }
    // } catch (err) {
    //   const { message, code } = _.get(err, 'response.data') || {}
    //   const { url: errorUrl, query: errorQuery } = qs.parseUrl(document.referrer)
    //   errorQuery.error = message || (code && 'Error Code ' + code) || 'Unknown error'
    //   return (window.location.href = errorUrl + '?' + qs.stringify(errorQuery))
    // }

    // return history.replace(state.comingFrom || '/home')
  }

  handlePostLimitedSAMLAuthentication = async () => {
    // TODO: cleanup all the redirect / callback code
    const hash = window.location.hash

    const state = JSON.parse(sessionStorage.getItem('preauth_state') || '{}')

    if (state.expiresAt) {
      const dt = moment(state.expiresAt, 'x')
      if (dt.isBefore(moment())) {
        // Login Session Expired
        return // TODO Throw an appropriate error
      }
    }

    const token = _.last(hash.split('id_token='))

    const identity = this.parseJwt(token)

    if (!this.isAuthenticated() && identity.sub && identity.sub.startsWith('samlp|')) {
      localStorage.removeItem('auth_csrfCode')
      this.setSession({ expiresIn: 7200, idToken: token })
    }

    this.handlePostAuthentication(state)
  }

  handleAuthentication = () => {
    throw new Error('Abstract method: Not implemented')
  }

  setSession(authResult) {
    // Set the time that the access token will expire at
    const expiresAt = JSON.stringify((authResult.expiresIn || 7200) * 1000 + new Date().getTime())
    localStorage.setItem('id_token', authResult.idToken)
    localStorage.setItem('expires_at', expiresAt)
  }

  parseJwt(token) {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace('-', '+').replace('_', '/')
    return JSON.parse(window.atob(base64))
  }

  logout = () => {
    // Clear access token and ID token from local storage
    localStorage.removeItem('id_token')
    localStorage.removeItem('expires_at')
    // navigate to the home route
    history.replace('/home')
  }

  isAuthenticated() {
    // Check whether the current time is past the
    // access token's expiry time
    const expiresAt = JSON.parse(localStorage.getItem('expires_at'))
    return new Date().getTime() < expiresAt
  }
}
