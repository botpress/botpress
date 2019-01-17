import React, { Component } from 'react'
import { Redirect, Link } from 'react-router-dom'
import { Alert, Col, Button, Input, FormGroup } from 'reactstrap'
import SectionLayout from '../Layouts/Section'
import { login, sendResetPassword, isAuthenticated } from '../../Auth/licensing'

export default class Login extends Component {
  state = {
    email: '',
    password: '',
    error: null,
    success: null,
    isLoading: false
  }

  login = async () => {
    this.setState({ error: null, success: null, isLoading: true })

    try {
      await login({
        email: this.state.email,
        password: this.state.password
      })

      this.forceUpdate()
    } catch (error) {
      this.setState({
        error: error.message,
        showResetPasswordLink: error.code === 'auth/wrong-password',
        isLoading: false
      })
    }
  }

  sendResetPassword = async () => {
    this.setState({ error: null, success: null, showResetPasswordLink: false })

    try {
      await sendResetPassword({ email: this.state.email })
      this.setState({
        success: `An email was sent to ${this.state.email} with instructions on how to reset your password.`
      })
    } catch (error) {
      this.setState({ error: error.message })
    }
  }

  handleInputChanged = event => this.setState({ [event.target.name]: event.target.value })
  handleInputKeyPress = e => e.key === 'Enter' && this.login()

  renderResetPassword() {
    return (
      <small>
        Forgot your password? &nbsp;
        <Button color="link" onClick={this.sendResetPassword}>
          Click here and we'll send you an email right away to change it.
        </Button>
      </small>
    )
  }

  renderForm = () => {
    if (isAuthenticated()) {
      return <Redirect to="/licensing/keys" />
    }

    return (
      <Col xs="4">
        {this.state.error && <Alert color="danger">{this.state.error}</Alert>}
        {this.state.success && <Alert color="success">{this.state.success}</Alert>}
        <FormGroup>
          <label htmlFor="email">Email Address</label>
          <Input
            value={this.state.email}
            type="text"
            name="email"
            id="email"
            onChange={this.handleInputChanged}
            onKeyPress={this.handleInputKeyPress}
          />
        </FormGroup>
        <FormGroup>
          <label htmlFor="password">Password</label>
          <Input
            value={this.state.password}
            type="password"
            name="password"
            id="password"
            onChange={this.handleInputChanged}
            onKeyPress={this.handleInputKeyPress}
          />
        </FormGroup>
        <div>
          <Button
            onClick={this.login}
            disabled={!this.state.email.length || !this.state.password.length || this.state.isLoading}
            size="m"
            color="primary"
          >
            Login
          </Button>

          <div className="registerBtn">
            <Link to="/licensing/register">
              <Button size="sm" color="link">
                Create an account
              </Button>
            </Link>
          </div>
        </div>
        {this.state.showResetPasswordLink && this.renderResetPassword()}
      </Col>
    )
  }

  render() {
    return (
      <SectionLayout
        title="Login to Botpress Licensing Server"
        activePage="licensing-login"
        mainContent={this.renderForm()}
      />
    )
  }
}
