import Promise from 'bluebird'
import axios from 'axios'
import { toast } from 'react-toastify'
import _ from 'lodash'
import { pullToken, logout } from './Auth'

const defaultOptions = {
  timeout: 2000
}

const createClient = (clientOptions, { toastErrors }) => {
  const client = axios.create({
    baseURL: '/admin',
    ...defaultOptions,
    ...clientOptions
  })

  client.interceptors.response.use(
    response => response,
    error => {
      const wrappedError = _.get(error, 'response.data')
      const errorCode = _.get(wrappedError, 'errorCode')
      if (errorCode) {
        if (errorCode === 'BP_0005') {
          return logout()
        }
        return Promise.reject(wrappedError)
      } else {
        return Promise.reject(error)
      }
    }
  )

  if (toastErrors) {
    client.interceptors.response.use(
      response => response,
      error => {
        const wrappedError = _.get(error, 'response.data')
        const message = _.get(wrappedError, 'message')

        if (wrappedError && message) {
          showToast(message)
        } else {
          error.message && showToast(error.message)
        }

        return Promise.reject(error)
      }
    )
  }
  return client
}

const showToast = message => {
  toast.error(message, {
    position: toast.POSITION.TOP_RIGHT
  })
}

const overrideApiUrl = process.env.REACT_APP_API_URL ? { baseURL: `${process.env.REACT_APP_API_URL}/admin` } : {}

export default {
  getSecured({ token, toastErrors = true } = {}) {
    if (!token) {
      const ls = pullToken()
      token = ls && ls.token
    }

    return createClient(
      {
        headers: {
          Authorization: `Bearer ${token}`
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
