import React from 'react'
import {Grid, Row, Col, Dropdown, MenuItem} from 'react-bootstrap'

import LoginPage from './Login'

import axios from 'axios'

import { getToken } from './tokens'

export default function ensureAuthenticated(WrappedComponent) {

  class AuthenticationManager extends React.Component {

    constructor(props, context) {
      super(props, context)
      this.state = { authenticated: !!getToken() }
      this.checkAuth = this.checkAuth.bind(this)
    }

    componentDidMount() {
      this.checkAuth()
      this.checkInterval = setInterval(this.checkAuth, 5000)
    }

    componentWillUnmount() {
      clearInterval(this.checkInterval)
    }

    checkAuth() {
      axios.get('/api/ping')
    }

    render() {
      return this.state.authenticated === true
        ? <WrappedComponent {...this.props} />
        : <LoginPage />
    }
  }

  return AuthenticationManager
}
