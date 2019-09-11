import { Button, FormGroup, InputGroup, Intent } from '@blueprintjs/core'
import React, { Component, Fragment } from 'react'
import { RouteComponentProps } from 'react-router'
import { Redirect } from 'react-router-dom'
import { Alert, Card, CardBody, CardText, CardTitle } from 'reactstrap'

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
  email: string
  password: string
  confirmPassword: string
  registerUrl?: string
  error?: string
  isFirstUser: boolean
}

export default class Register extends Component<Props, State> {
  state = {
    email: '',
    password: '',
    confirmPassword: '',
    registerUrl: undefined,
    error: undefined,
    isFirstUser: false
  }

  componentDidMount() {
    // tslint:disable-next-line: no-floating-promises
    this.loadAuthConfig()
    setActiveWorkspace(this.props.match.params.workspace)
  }

  loadAuthConfig = async () => {
    const strategyConfig = await this.props.auth.getStrategyConfig(this.props.match.params.strategy)
    if (!strategyConfig) {
      return this.setState({ error: 'Invalid strategy' })
    }

    this.setState({ ...strategyConfig })
  }

  register = async event => {
    event.preventDefault()
    const { email, password, confirmPassword, registerUrl } = this.state

    if (password !== confirmPassword) {
      return this.setState({ error: `Passwords don't match` })
    }

    this.setState({ error: undefined })

    try {
      await this.props.auth.register({ email, password }, registerUrl)
    } catch (err) {
      this.setState({ error: err.message })
    }
  }

  handleEmailChanged = e => this.setState({ email: e.target.value })
  handlePasswordChanged = e => this.setState({ password: e.target.value })
  handleConfirmChanged = e => this.setState({ confirmPassword: e.target.value })

  get isFormValid() {
    const { email, password, confirmPassword } = this.state
    return email.length > 4 && password.length > 4 && confirmPassword.length > 4
  }

  renderForm = () => {
    return (
      <form onSubmit={this.register}>
        <CardTitle>Botpress Admin Panel</CardTitle>
        <CardText>This is the first time you run Botpress. Please create the master admin account.</CardText>
        {this.state.error && <Alert color="danger">{this.state.error}</Alert>}
        <FormGroup label="E-mail">
          <InputGroup
            tabIndex={1}
            type="text"
            id="email"
            value={this.state.email}
            onChange={this.handleEmailChanged}
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

        <FormGroup label="Confirm Password">
          <InputGroup
            tabIndex={3}
            type="password"
            id="confirmPassword"
            value={this.state.confirmPassword}
            onChange={this.handleConfirmChanged}
          />
        </FormGroup>

        <Button
          tabIndex={4}
          type="submit"
          id="btn-register"
          text="Create Account"
          intent={Intent.PRIMARY}
          disabled={!this.isFormValid}
        />
      </form>
    )
  }

  render() {
    if (this.props.auth.isAuthenticated() || (this.state.registerUrl && !this.state.isFirstUser)) {
      return <Redirect to="/" />
    }

    return (
      <div className="centered-container">
        <div className="middle">
          <div className="inner">
            <img className="logo" src={logo} alt="loading" />
            <Card body>
              <CardBody className="login-box">{this.renderForm()}</CardBody>
            </Card>
          </div>
        </div>
      </div>
    )
  }
}
