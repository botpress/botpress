import React, { Component, Fragment } from 'react'
import { Redirect } from 'react-router-dom'
import logo from '../../media/nobg_white.png'

import { Alert, Card, CardBody, CardTitle, Button, Input, FormGroup, CardText } from 'reactstrap'

export default class Register extends Component {
  state = {
    email: '',
    password: '',
    confirmPassword: ''
  }

  register = async () => {
    this.setState({ error: null })

    if (this.state.password !== this.state.confirmPassword) {
      this.setState({ error: `Passwords don't match` })
      return
    }

    try {
      await this.props.auth.register({
        email: this.state.email,
        password: this.state.password
      })
    } catch (err) {
      this.setState({ error: err.message })
    }
  }

  handleInputChange = e => this.setState({ [e.target.name]: e.target.value })
  handleInputKeyPress = e => e.key === 'Enter' && this.register()

  get isFormValid() {
    const { email, password, confirmPassword } = this.state
    return email.length > 4 && password.length > 4 && confirmPassword.length > 4
  }

  renderForm = () => {
    return (
      <Fragment>
        <CardTitle>Botpress Admin Panel</CardTitle>
        <CardText>This is the first time you run Botpress. Please create the master admin account.</CardText>
        {this.state.error && <Alert color="danger">{this.state.error}</Alert>}
        <FormGroup>
          <label htmlFor="email">E-mail</label>
          <Input
            type="text"
            name="email"
            id="email"
            value={this.state.email}
            onChange={this.handleInputChange}
            onKeyPress={this.onInputKeyPress}
          />
        </FormGroup>
        <FormGroup>
          <label htmlFor="password">Password</label>
          <Input
            type="password"
            name="password"
            id="password"
            value={this.state.password}
            onChange={this.handleInputChange}
            onKeyPress={this.handleInputKeyPress}
          />
        </FormGroup>
        <FormGroup>
          <label htmlFor="confirmPassword">Confirm password</label>
          <Input
            type="password"
            name="confirmPassword"
            id="confirmPassword"
            value={this.state.confirmPassword}
            onChange={this.handleInputChange}
            onKeyPress={this.handleInputKeyPress}
          />
        </FormGroup>
        <p>
          <Button onClick={this.register} color="primary" disabled={!this.isFormValid}>
            Create Account
          </Button>
        </p>
      </Fragment>
    )
  }

  render() {
    if (this.props.auth.isAuthenticated()) {
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
