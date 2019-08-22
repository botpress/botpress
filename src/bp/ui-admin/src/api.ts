import axios from 'axios'
import Promise from 'bluebird'
import _ from 'lodash'

import { toastError } from './utils/toaster'
import { getActiveWorkspace, logout, pullToken } from './Auth'

const createClient = (clientOptions: any, options: { toastErrors?: boolean }) => {
  const client = axios.create({ timeout: 2000, ...clientOptions })

  client.interceptors.response.use(
    response => response,
    error => {
      const wrappedError = _.get(error, 'response.data')
      const errorCode = _.get(wrappedError, 'errorCode')
      if (errorCode) {
        if (['BP_0041'].includes(errorCode)) {
          return logout()
        }
        return Promise.reject(wrappedError)
      } else {
        return Promise.reject(error)
      }
    }
  )

  if (options.toastErrors) {
    client.interceptors.response.use(
      response => response,
      error => {
        toastError(error)

        return Promise.reject(error)
      }
    )
  }
  return client
}

const overrideApiUrl = process.env.REACT_APP_API_URL
  ? { baseURL: `${process.env.REACT_APP_API_URL}/api/v1` }
  : { baseURL: `${window['ROOT_PATH']}/api/v1` }

export default {
  getApiPath() {
    return overrideApiUrl.baseURL
  },

  getSecured({ token = undefined, toastErrors = true, timeout = 2000 } = {}) {
    if (!token) {
      const ls = pullToken()
      token = ls && ls.token
    }

    return createClient(
      {
        timeout,
        headers: {
          Authorization: `Bearer ${token}`,
          'X-BP-Workspace': getActiveWorkspace()
        },
        ...overrideApiUrl
      },
      { toastErrors }
    )
  },

  getAnonymous({ toastErrors = true } = {}) {
    return createClient(overrideApiUrl, { toastErrors })
  }
}
