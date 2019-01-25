import React, { Component, Fragment } from 'react'
import { Redirect } from 'react-router-dom'
import logo from '../../media/nobg_white.png'

import { Alert, Card, CardBody, CardTitle, Button, Input, FormGroup, CardText } from 'reactstrap'

export default class ChangePassword extends Component {
  constructor(props) {
    super(props)

    this.state = {
      ...props.location.state,
      newPassword: '',
      confirmPassword: ''
    }
  }

  login = async () => {
    this.setState({ error: null })

    if (this.state.newPassword !== this.state.confirmPassword) {
      this.setState({ error: `Passwords don't match` })
      return
    }

    try {
      await this.props.auth.login({
        email: this.state.email,
        password: this.state.password,
        newPassword: this.state.newPassword
      })
    } catch (err) {
      this.setState({ error: err.message })
    }
  }

  onInputChange = name => event => {
    this.setState({ [name]: event.target.value })
  }

  onInputKeyPress = e => {
    if (e.key === 'Enter') {
      this.login()
    }
  }

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
      <Fragment>
        <CardTitle>Botpress Admin Panel</CardTitle>
        <CardText>{this.getReasonText()}</CardText>
        {this.state.error && <Alert color="danger">{this.state.error}</Alert>}
        <FormGroup>
          <label htmlFor="newPassword">Password</label>
          <Input
            value={this.state.newPassword}
            onChange={this.onInputChange('newPassword')}
            type="password"
            name="newPassword"
            id="newPassword"
            onKeyPress={this.onInputKeyPress}
          />
        </FormGroup>
        <FormGroup>
          <label htmlFor="confirmPassword">Confirm password</label>
          <Input
            value={this.state.confirmPassword}
            onChange={this.onInputChange('confirmPassword')}
            type="password"
            name="confirmPassword"
            id="confirmPassword"
            onKeyPress={this.onInputKeyPress}
          />
        </FormGroup>
        <p>
          <Button onClick={this.login}>Change</Button>
        </p>
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
