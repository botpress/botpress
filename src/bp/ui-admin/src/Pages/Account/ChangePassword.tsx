import { Button, FormGroup, InputGroup, Intent } from '@blueprintjs/core'
import React, { Component, Fragment } from 'react'
import { RouteComponentProps } from 'react-router'
import { Redirect } from 'react-router-dom'
import { Alert, Card, CardBody, CardText, CardTitle } from 'reactstrap'

import logo from '../../media/nobg_white.png'

type Props = {
  auth: any
} & RouteComponentProps

interface State {
  loginUrl: string
  email: string
  password: string
  newPassword: string
  confirmPassword: string
  error?: string
}

export default class ChangePassword extends Component<Props, State> {
  constructor(props) {
    super(props)

    this.state = {
      ...props.location.state,
      newPassword: '',
      confirmPassword: '',
      error: undefined
    }
  }

  updatePassword = async event => {
    event.preventDefault()
    const { email, password, newPassword, confirmPassword, loginUrl } = this.state

    if (newPassword !== confirmPassword) {
      return this.setState({ error: `Passwords don't match` })
    }

    this.setState({ error: undefined })

    try {
      await this.props.auth.login({ email, password, newPassword }, loginUrl)
    } catch (err) {
      this.setState({ error: err.message })
    }
  }

  handleNewPasswordChanged = e => this.setState({ newPassword: e.target.value })
  handleConfirmChanged = e => this.setState({ confirmPassword: e.target.value })

  getReasonText = () => {
    if (this.state.password === '') {
      return 'This is the first time you run Botpress. Please pick a password.'
    }

    return 'Your password has expired or was temporary. Please set a new password.'
  }

  renderForm = () => {
    if (!this.state.email) {
      return <Redirect to="/" />
    }

    return (
      <form onSubmit={this.updatePassword}>
        <CardTitle>Botpress Admin Panel</CardTitle>
        <CardText>{this.getReasonText()}</CardText>
        {this.state.error && <Alert color="danger">{this.state.error}</Alert>}
        <FormGroup label="Password">
          <InputGroup
            tabIndex={1}
            value={this.state.newPassword}
            onChange={this.handleNewPasswordChanged}
            type="password"
            name="newPassword"
            id="newPassword"
            autoFocus={true}
          />
        </FormGroup>

        <FormGroup label="Confirm Password">
          <InputGroup
            tabIndex={2}
            value={this.state.confirmPassword}
            onChange={this.handleConfirmChanged}
            type="password"
            name="confirmPassword"
            id="confirmPassword"
          />
        </FormGroup>

        <p>
          <Button
            tabIndex={3}
            type="submit"
            text="Change"
            intent={Intent.PRIMARY}
            disabled={!this.state.newPassword || !this.state.confirmPassword}
          />
        </p>
      </form>
    )
  }

  render() {
    if (this.props.auth.isAuthenticated()) {
      return <Redirect to={{ pathname: '/' }} />
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
