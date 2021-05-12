import axios from 'axios'
import { CSRF_TOKEN_HEADER } from 'common/auth'
import { EventEmitter2 } from 'eventemitter2'

import * as auth from '../../../../ui-shared-lite/auth'

export const authEvents = new EventEmitter2()

export const setToken = (token: any): void => {
  auth.setToken(token)

  axios.defaults.headers.common[CSRF_TOKEN_HEADER] = token.csrf
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  authEvents.emit('new_token')
}
