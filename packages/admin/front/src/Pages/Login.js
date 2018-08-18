import React, { Component, Fragment } from 'react'
import { Redirect } from 'react-router-dom'
import logo from '../media/nobg_white.png'
import _ from 'lodash'

import { Alert, Card, CardBody, CardTitle, CardText, Button, Input } from 'reactstrap'

export default class Login extends Component {
  state = { username: '', password: '', error: null }

  login = async () => {
    this.setState({ error: null })
    const frm = _.get(this, 'props.location.state.from')
    const extraParams = _.pick(_.get(this, 'props.location.query'), [
      'action',
      'botId',
      'callbackPath',
      'comingFrom',
      'csrfCode',
      'env',
      'expiresAt',
      'params'
    ])
    let redirectTo = frm ? `${frm.pathname}${frm.search}${frm.hash}` : null
    try {
      await this.props.auth.login({
        comingFrom: redirectTo,
        ...extraParams,
        credentials: { username: this.state.username, password: this.state.password }
      })
    } catch (err) {
      this.setState({ error: err.message })
    }
  }

  renderAuth0Form = () => {
    return (
      <Fragment>
        <CardTitle>Sign in</CardTitle>
        <CardText>Free sign-in and sign-up using your GitHub account.</CardText>
        <Button onClick={this.login}>Sign in</Button>
      </Fragment>
    )
  }

  onInputChange = name => event => {
    this.setState({ [name]: event.target.value })
  }

  onInputKeyPress = e => {
    if (e.key === 'Enter') {
      this.login()
    }
  }

  renderBasicForm = () => {
    const loginMessage = process.env.REACT_APP_LOGIN_BOX_MSG || 'Restricted Access.'
    return (
      <Fragment>
        <CardTitle>Botpress Enterprise</CardTitle>
        <CardText>{loginMessage}</CardText>
        {this.state.error && <Alert color="danger">{this.state.error}</Alert>}
        <Input
          value={this.state.username}
          onChange={this.onInputChange('username')}
          type="text"
          name="username"
          id="username"
          onKeyPress={this.onInputKeyPress}
          placeholder="Username"
        />
        <Input
          value={this.state.password}
          onChange={this.onInputChange('password')}
          type="password"
          name="password"
          id="password"
          onKeyPress={this.onInputKeyPress}
          placeholder="Password"
        />
        <Button onClick={this.login}>Sign in</Button>
      </Fragment>
    )
  }

  render() {
    const isAuthenticated = this.props.auth.isAuthenticated()

    if (isAuthenticated) {
      return (
        <Redirect
          to={{
            pathname: '/'
          }}
        />
      )
    }

    const renderForm = process.env.REACT_APP_AUTH_PROVIDER === 'basic' ? this.renderBasicForm : this.renderAuth0Form

    return (
      <div className="centered-container">
        <div className="middle">
          <div className="inner">
            <img className="logo" src={logo} alt="loading" />
            <Card body>
              <CardBody className="login-box">{renderForm()}</CardBody>
            </Card>
          </div>
        </div>
      </div>
    )
  }
}
