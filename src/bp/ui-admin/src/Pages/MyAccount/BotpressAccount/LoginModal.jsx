import React, { Component } from 'react'
import { Alert, Col, Button, Input, FormGroup, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'

import * as licensing from '../../../Auth/licensing'

const DEFAULT_STATE = {
  email: '',
  password: '',
  error: null,
  success: null,
  isLoading: false,
  isRegistering: false,
  showResetPasswordLink: false
}

const WRONG_PASSWORD_CODE = 'auth/wrong-password'
const MIN_PW_LENGHT = 6

export default class Login extends Component {
  state = { ...DEFAULT_STATE }

  componentDidMount() {
    this.setSubmitAction()
  }

  componentDidUpdate() {
    this.setSubmitAction()
  }

  setSubmitAction = () => {
    this.submitAction = this.state.isRegistering ? this.register : this.login
  }

  login = async () => {
    this.setState({ error: null, success: null, isLoading: true })

    try {
      await licensing.login({
        email: this.state.email,
        password: this.state.password
      })

      this.props.toggle()
    } catch (error) {
      this.setState({
        error: error.message,
        showResetPasswordLink: error.code === WRONG_PASSWORD_CODE,
        isLoading: false
      })
    }
  }

  register = async () => {
    this.setState({ error: null, isLoading: true })

    try {
      await licensing.register({
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
      await licensing.sendResetPassword({ email: this.state.email })
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

  isFormValid = () => {
    return this.formEl && this.formEl.checkValidity() && this.state.password.length >= MIN_PW_LENGHT
  }

  handleInputChanged = event => this.setState({ [event.target.name]: event.target.value })

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

  renderToggleRegister() {
    return (
      <div className="registerBtn">
        <Button size="sm" color="link" onClick={this.setRegisterMode}>
          Create an account
        </Button>
      </div>
    )
  }

  toggle = () => {
    this.setState({ ...DEFAULT_STATE })
    this.props.toggle()
  }

  renderForm = () => {
    return (
      <Col>
        {this.state.error && <Alert color="danger">{this.state.error}</Alert>}
        {this.state.success && <Alert color="success">{this.state.success}</Alert>}
        <form
          ref={form => {
            this.formEl = form
          }}
          onSubmit={e => {
            e.preventDefault()
            this.submitAction()
          }}
          noValidate
        >
          <FormGroup>
            <label htmlFor="email">Email Address</label>
            <Input value={this.state.email} type="email" name="email" id="email" onChange={this.handleInputChanged} />
          </FormGroup>
          <FormGroup>
            <label htmlFor="password">Password</label>
            <Input
              value={this.state.password}
              type="password"
              name="password"
              id="password"
              onChange={this.handleInputChanged}
            />
          </FormGroup>
          <div>
            <Button type="submit" disabled={!this.isFormValid()} size="m" color="primary">
              {this.state.isRegistering ? 'Register' : 'Login'}
            </Button>
            {!this.state.isRegistering && this.renderToggleRegister()}
          </div>
        </form>
      </Col>
    )
  }

  render() {
    const page = this.renderForm()
    const headerLabel = this.state.isRegistering ? 'Create an account' : 'Login to your account'
    return (
      <Modal isOpen={this.props.isOpen} toggle={this.toggle} size="md">
        <ModalHeader toggle={this.toggle}>{headerLabel}</ModalHeader>
        <ModalBody>{page}</ModalBody>
        <ModalFooter>{this.state.showResetPasswordLink && this.renderResetPassword()}</ModalFooter>
      </Modal>
    )
  }
}
