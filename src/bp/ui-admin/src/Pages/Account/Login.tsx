import { Button, FormGroup, InputGroup, Intent } from '@blueprintjs/core'
import { get } from 'lodash'
import React, { Component, Fragment } from 'react'
import { RouteComponentProps } from 'react-router'
import { Redirect } from 'react-router-dom'
import { Alert, Card, CardBody, CardText, CardTitle } from 'reactstrap'

import api from '../../api'
import logo from '../../media/nobg_white.png'
import { setActiveWorkspace } from '../../Auth'

interface Params {
  strategy: string
  workspace: string
}

type Props = {
  auth: any
} & RouteComponentProps<Params>

interface State {
  isLoading: boolean
  isFirstTimeUse: boolean
  email: string
  strategyType: string
  authEndpoint: string
  password: string
  passwordExpired: boolean
  error?: string
  loginUrl: string
  strategyId: string
}

export default class Login extends Component<Props, State> {
  state: State = {
    isLoading: true,
    isFirstTimeUse: false,
    passwordExpired: false,
    strategyType: 'basic',
    strategyId: '',
    authEndpoint: '',
    email: '',
    password: '',
    loginUrl: '',
    error: undefined
  }

  loadAuthConfig = async () => {
    const { isFirstUser, ...strategyConfig } = await this.props.auth.getStrategyConfig(this.props.match.params.strategy)

    if (!strategyConfig) {
      return this.setState({ isLoading: false, error: 'Invalid strategy' })
    }

    this.setState({
      isLoading: false,
      isFirstTimeUse: isFirstUser,
      ...strategyConfig
    })
  }

  componentDidMount() {
    // tslint:disable-next-line: no-floating-promises
    this.loadAuthConfig()
    this.checkErrorMessages()

    setActiveWorkspace(this.props.match.params.workspace)
  }

  login = async event => {
    event.preventDefault()

    const { email, password, loginUrl } = this.state
    this.setState({ error: undefined })

    try {
      await this.props.auth.login({ email, password }, loginUrl)
    } catch (err) {
      if (err.type === 'PasswordExpiredError') {
        this.setState({ passwordExpired: true })
      } else {
        const message = get(err, 'response.data.message', err.message)
        this.setState({ error: message })
      }
    }
  }

  checkErrorMessages = () => {
    const urlParams = new window.URLSearchParams(window.location.search)
    const errorMessage = urlParams.get('error')

    if (errorMessage && errorMessage.length) {
      this.setState({ error: errorMessage })
    }
  }

  handleEmailChanged = e => this.setState({ email: e.target.value })
  handlePasswordChanged = e => this.setState({ password: e.target.value })

  redirectToExternalAuthProvider = () => {
    const { strategyId, strategyType, authEndpoint } = this.state

    if (strategyType === 'saml' || strategyType === 'oauth2') {
      return (window.location.href = `${api.getApiPath()}/auth/redirect/${strategyType}/${strategyId}`)
    }

    if (authEndpoint) {
      window.location.href = authEndpoint
    }
  }

  renderForm = () => {
    return (
      <form onSubmit={this.login}>
        <CardTitle>Botpress Admin Panel</CardTitle>
        <CardText>Login</CardText>
        {this.state.error && <Alert color="danger">{this.state.error}</Alert>}
        <FormGroup label="E-mail">
          <InputGroup
            tabIndex={1}
            value={this.state.email}
            onChange={this.handleEmailChanged}
            type="text"
            id="email"
            autoFocus={true}
          />
        </FormGroup>

        <FormGroup label="Password">
          <InputGroup
            tabIndex={2}
            value={this.state.password}
            onChange={this.handlePasswordChanged}
            type="password"
            id="password"
          />
        </FormGroup>

        <Button
          tabIndex={3}
          type="submit"
          id="btn-signin"
          text="Sign in"
          disabled={!this.state.email || !this.state.password}
          intent={Intent.PRIMARY}
        />
      </form>
    )
  }

  renderExternal() {
    return (
      <Fragment>
        <CardTitle>Botpress Admin Panel</CardTitle>
        <CardText>Login</CardText>
        {this.state.error && <Alert color="danger">{this.state.error}</Alert>}
        <p>
          <Button
            id="btn-sso"
            text="Sign in with SSO"
            onClick={this.redirectToExternalAuthProvider}
            intent={Intent.PRIMARY}
          />
        </p>
      </Fragment>
    )
  }

  render() {
    const { strategyType } = this.state

    if (this.props.auth.isAuthenticated()) {
      return <Redirect to="/" />
    }

    if (this.state.isFirstTimeUse && strategyType === 'basic') {
      return <Redirect to="/register" />
    }

    if (this.state.passwordExpired) {
      return <Redirect to={{ pathname: '/ChangePassword', state: this.state }} />
    }

    if (this.state.isLoading) {
      return null
    }

    return (
      <div className="centered-container">
        <div className="middle">
          <div className="inner">
            <img className="logo" src={logo} alt="loading" />
            <Card body>
              <CardBody className="login-box">
                {strategyType === 'saml' || strategyType === 'oauth2' ? this.renderExternal() : this.renderForm()}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    )
  }
}
