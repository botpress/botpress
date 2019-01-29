import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import { Alert, Col, Button, Input, FormGroup, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'

import { login, register, sendResetPassword, isAuthenticated } from '../../../Auth/licensing'

const DEFAULT_STATE = {
  email: '',
  password: '',
  error: null,
  success: null,
  isLoading: false,
  isRegistering: false
}

export default class Login extends Component {
  state = { ...DEFAULT_STATE }

  login = async () => {
    this.setState({ error: null, success: null, isLoading: true })

    try {
      await login({
        email: this.state.email,
        password: this.state.password
      })

      this.props.toggle()
    } catch (error) {
      this.setState({
        error: error.message,
        showResetPasswordLink: error.code === 'auth/wrong-password',
        isLoading: false
      })
    }
  }

  register = async () => {
    this.setState({ error: null, isLoading: true })

    try {
      await register({
        email: this.state.email,
        password: this.state.password
      })

      this.props.toggle()
    } catch (error) {
      this.setState({
        error: error.message,
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

  setRegisterMode = () => {
    this.setState({ error: null, isRegistering: true, showResetPasswordLink: false })
  }

  handleInputChanged = event => this.setState({ [event.target.name]: event.target.value })
  handleInputKeyPress = e => {
    if (e.key === 'Enter') {
      this.state.isRegistering ? this.register() : this.login()
    }
  }

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

  toggle = () => {
    this.setState({ ...DEFAULT_STATE })
    this.props.toggle()
  }

  renderForm = () => {
    if (isAuthenticated()) {
      return <Redirect to="/licensing/keys" />
    }

    return (
      <Col>
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
            {this.state.isRegistering ? 'Register' : 'Login'}
          </Button>

          {!this.state.isRegistering && (
            <div className="registerBtn">
              <Button size="sm" color="link" onClick={this.setRegisterMode}>
                Create an account
              </Button>
            </div>
          )}
        </div>
      </Col>
    )
  }

  render() {
    const page = this.renderForm()
    return (
      <Modal isOpen={this.props.isOpen} toggle={this.toggle} size="md">
        <ModalHeader toggle={this.toggle}>
          {this.state.isRegistering ? 'Create an account' : 'Login to your account'}
        </ModalHeader>
        <ModalBody>{page}</ModalBody>
        <ModalFooter>{this.state.showResetPasswordLink && this.renderResetPassword()}</ModalFooter>
      </Modal>
    )
  }
}
