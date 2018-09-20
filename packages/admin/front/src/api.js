import Promise from 'bluebird'
import axios from 'axios'
import { toast } from 'react-toastify'
import _ from 'lodash'
import { pullToken } from './Auth'

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

      if (_.get(wrappedError, 'code')) {
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
        error.message &&
          toast.error(error.message, {
            position: toast.POSITION.TOP_RIGHT
          })

        return Promise.reject(error)
      }
    )
  }

  return client
}

export default {
  getSecured({ token, toastErrors = true } = {}) {
    if (!token) {
      const ls = pullToken()
      console.log(ls)
      token = ls && ls.token
    }

    return createClient(
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      { toastErrors }
    )
  },

  getAnonymous({ toastErrors = true } = {}) {
    return createClient({}, { toastErrors })
  }
}
