import React from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import qs from 'query-string'

import axios from 'axios'
import _ from 'lodash'

import { getToken, logout, authEvents, setToken } from '~/util/Auth'

const CHECK_AUTH_INTERVAL = 60 * 1000

const validateToken = () => {
  const token = getToken()
  const elapsed = new Date() - new Date(token.time)
  const tokenStillValid = !!token && elapsed < window.AUTH_TOKEN_DURATION
  if (!tokenStillValid) {
    logout()
  }
  return tokenStillValid
}

const ensureAuthenticated = WrappedComponent => {
  class AuthenticationWrapper extends React.Component {
    static contextTypes = {
      router: PropTypes.object
    }

    state = {
      authorized: false
    }

    componentDidMount() {
      authEvents.on('logout', this.promptLogin)
      this.setupAuth()
    }

    componentWillUnmount() {
      authEvents.off('logout', this.promptLogin)
      clearInterval(this.checkInterval)
    }

    promptLogin = () => {
      const urlToken = _.get(this.props, 'location.query.token')

      if (location.pathname !== '/login' && !urlToken) {
        this.context.router.history.push('/login?returnTo=' + location.pathname)
      }
      window.botpressWebChat && window.botpressWebChat.sendEvent({ type: 'hide' })
    }

    setupAuth() {
      if (!window.AUTH_ENABLED && !this.state.authorized) {
        this.setState({ authorized: true })
        return
      }

      const urlToken = _.get(this.props, 'location.query.token')
      const params = JSON.parse(_.get(this.props, 'location.query.params') || '{}')

      if (urlToken) {
        setToken(urlToken)
        const newQuery = _.omit(this.props.location.query, ['token', 'botId', 'env', 'params'])
        this.context.router.history.replace(
          Object.assign({}, this.props.location, {
            search: qs.stringify(newQuery),
            query: newQuery,
            pathname: params.returnTo || this.props.location.pathname
          })
        )
      }

      const tokenStillValid = validateToken()
      this.setState({ authorized: tokenStillValid })

      if (tokenStillValid) {
        this.checkAuth()
        this.checkInterval = setInterval(this.checkAuth, CHECK_AUTH_INTERVAL)
      } else {
        this.promptLogin()
      }
    }

    checkAuth = () => {
      axios.get('/api/ping').catch(err => {
        if (err.response.status === 401) {
          this.promptLogin()
        }
      })
    }

    render() {
      return this.state.authorized === true ? <WrappedComponent {...this.props} /> : null
    }
  }

  return withRouter(AuthenticationWrapper)
}

export default ensureAuthenticated
