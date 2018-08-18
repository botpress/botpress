import BaseAuth from './base'
import api from '../api'

import qs from 'query-string'
import history from '../history'

export default class BasicAuthentication extends BaseAuth {
  async doLogin({ state, connection, credentials }) {
    sessionStorage.setItem('preauth_state', JSON.stringify(state))

    if (!credentials) {
      return history.replace({
        pathname: '/login',
        search: '?' + qs.stringify(state)
      })
    }

    const { username, password } = credentials

    const { data } = await api.getAnonymous({ toastErrors: false }).post('/api/login', {
      username,
      password
    })

    this.setSession({ expiresIn: 7200, idToken: data.payload.token })
    await this.handlePostAuthentication(state)
  }
}
