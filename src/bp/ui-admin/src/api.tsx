import axios from 'axios'
import Promise from 'bluebird'
import { auth } from 'botpress/shared'
import { CSRF_TOKEN_HEADER } from 'common/auth'
import _ from 'lodash'
import React from 'react'

import { getActiveWorkspace } from './Auth'
import { toastFailure } from './utils/toaster'

interface SecuredApi {
  token?: string
  toastErrors?: boolean
  timeout?: number
}

export const toastError = error => {
  const errorCode = _.get(error, 'response.data.errorCode') || _.get(error, 'errorCode')
  const details = _.get(error, 'response.data.message') || _.get(error, 'message')
  const docs = _.get(error, 'response.data.docs') || _.get(error, 'docs')

  let message = (
    <span>
      {errorCode && <span>[{errorCode}]</span>} {details}{' '}
      {docs && (
        <a href={docs} target="_blank">
          More information
        </a>
      )}
    </span>
  )

  if (!errorCode && !message) {
    message = <span>Something wrong happened. Please try again later.</span>
  }

  toastFailure(message)
}

const createClient = (clientOptions: any, options: { toastErrors?: boolean }) => {
  const client = axios.create({ timeout: 6000, withCredentials: window.USE_JWT_COOKIES, ...clientOptions })

  client.interceptors.response.use(
    response => response,
    error => {
      const wrappedError = _.get(error, 'response.data')
      const errorCode = _.get(wrappedError, 'errorCode')
      const url = _.get(error, 'response.config.url')
      if (errorCode) {
        if (['BP_0041'].includes(errorCode) && url !== '/auth/logout') {
          return auth.logout(() => client)
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
  ? { baseURL: `${process.env.REACT_APP_API_URL}api/v1` }
  : { baseURL: `${window['ROOT_PATH']}/api/v1` }

export default {
  getApiPath() {
    return overrideApiUrl.baseURL
  },

  getSecured({ token = undefined, toastErrors = true, timeout = 10000 }: SecuredApi = {}) {
    if (!token) {
      token = auth.getToken(true) as string
    }

    return createClient(
      {
        timeout,
        headers: {
          ...(window.USE_JWT_COOKIES ? { [CSRF_TOKEN_HEADER]: token } : { Authorization: `Bearer ${token}` }),
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
