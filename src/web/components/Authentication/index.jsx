import React from 'react'
import PropTypes from 'prop-types'

import axios from 'axios'
import _ from 'lodash'

import { getToken, logout, authEvents, setToken } from '~/util/Auth'

const CHECK_AUTH_INTERVAL = 60 * 1000

export default function ensureAuthenticated(WrappedComponent) {

  const validateToken = () => {
    const token = getToken()
    const elapsed = new Date() - new Date(token.time)
    const tokenStillValid = !!token && elapsed < window.AUTH_TOKEN_DURATION
    if(!tokenStillValid) {
      logout()
    }
    return tokenStillValid
  }

  class AuthenticationWrapper extends React.Component {

    static contextTypes = {
      router: PropTypes.object
    }

    constructor(props, context) {
      super(props, context)

      this.state = { authorized: false }

      this.setupAuth = this.setupAuth.bind(this)
      this.checkAuth = this.checkAuth.bind(this)
      this.promptLogin = this.promptLogin.bind(this)
    }

    componentDidMount() {
      authEvents.on('logout', this.promptLogin)
      this.setupAuth()
    }

    componentWillUnmount() {
      authEvents.off('logout', this.promptLogin)
      clearInterval(this.checkInterval)
    }

    promptLogin() {
      const urlToken = _.get(this.props, 'location.query.token')

      if(location.pathname !== '/login' && !urlToken) {
        this.context.router.push('/login?returnTo=' + location.pathname)
      }
    }

    setupAuth() {
      if (!window.AUTH_ENABLED && !this.state.authorized) {
        this.setState({ authorized: true })
      } else {
        const tokenStillValid = validateToken()
        this.setState({ authorized: tokenStillValid })
        if(tokenStillValid) {
          this.checkAuth()
          this.checkInterval = setInterval(this.checkAuth, CHECK_AUTH_INTERVAL)
        } else {
          const urlToken = _.get(this.props, 'location.query.token')
          if (urlToken) {
            setToken(urlToken)
            this.context.router.replace(Object.assign(this.props.location, {
              query: _.omit(this.props.location.query, 'token')
            }))
            this.setupAuth()
          } else {
            this.promptLogin()
          }
        }
      }
    }

    checkAuth() {
      axios.get('/api/ping')
        .catch((err) => {
          if(err.response.status === 401) {
            this.promptLogin()
          }
        })
    }

    render() {
      return this.state.authorized === true
        ? <WrappedComponent {...this.props} />
        : null
    }
  }

  return AuthenticationWrapper
}
