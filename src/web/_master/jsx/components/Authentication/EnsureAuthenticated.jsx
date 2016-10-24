import React from 'react'
import {Grid, Row, Col, Dropdown, MenuItem} from 'react-bootstrap'

import LoginPage from './Login'

import axios from 'axios'

import { getToken, logout, authEvents } from './auth'

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

  class AuthenticationManager extends React.Component {

    constructor(props, context) {
      super(props, context)
      this.state = { authorized: false }
      this.setupAuth = this.setupAuth.bind(this)
      this.checkAuth = this.checkAuth.bind(this)
      this.promptLogin = this.promptLogin.bind(this)
    }

    componentDidMount() {
      this.setupAuth()
      authEvents.on('logout', this.promptLogin)
    }

    componentWillUnmount() {
      clearInterval(this.checkInterval)
      authEvents.off('logout', this.promptLogin)
    }

    promptLogin() {
      this.context.router.push('/login?returnTo=' + location.pathname)
    }

    setupAuth() {
      if (!window.AUTH_ENABLED && !this.state.authorized) {
        this.setState({ authorized: true })
      } else {
        const tokenStillValid = validateToken()
        this.setState({ authorized: tokenStillValid })
        if(tokenStillValid) {
          this.checkAuth()
          this.checkInterval = setInterval(this.checkAuth, 60 * 1000)
        } else {
          this.promptLogin()
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

  AuthenticationManager.contextTypes = {
    router: React.PropTypes.object
  }

  return AuthenticationManager
}
