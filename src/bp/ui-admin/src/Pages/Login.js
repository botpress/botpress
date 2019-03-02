import React, { Component, Fragment } from 'react'
import { Redirect } from 'react-router-dom'
import logo from '../media/nobg_white.png'
import api from '../api'
import { Alert, Card, CardBody, CardTitle, Button, Input, FormGroup, CardText } from 'reactstrap'

export default class Login extends Component {
  state = {
    isLoading: true,
    isFirstTimeUse: false,
    email: '',
    authStrategy: 'basic',
    authEndpoint: null,
    password: '',
    passwordExpired: false,
    error: null
  }

  loadAuthConfig = async () => {
    const { data } = await api.getAnonymous().get('/auth/config')

    this.setState({
      isLoading: false,
      isFirstTimeUse: data.payload.isFirstTimeUse,
      authStrategy: data.payload.strategy,
      authEndpoint: data.payload.authEndpoint
    })
  }

  componentDidMount() {
    this.loadAuthConfig()
    this.checkErrorMessages()
  }

  login = async ({ email, password, showError = true } = {}) => {
    this.setState({ error: null })

    try {
      await this.props.auth.login({
        email: email || this.state.email,
        password: password || this.state.password
      })
    } catch (err) {
      if (err.type === 'PasswordExpiredError') {
        if (!this.state.email || !this.state.password) {
          this.setState({ email, password })
        }

        this.setState({ passwordExpired: true })
      } else {
        showError && this.setState({ error: err.message })
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

  handleInputChange = e => this.setState({ [e.target.name]: e.target.value })
  handleInputKeyPress = e => e.key === 'Enter' && this.login()

  redirectToExternalAuthProvider = () => {
    if (this.state.authStrategy === 'saml') {
      return (window.location = `${api.getApiPath()}/auth/saml-redirect`)
    }

    window.location = this.state.authEndpoint
  }

  renderForm = () => {
    return (
      <Fragment>
        <CardTitle>Botpress Admin Panel</CardTitle>
        <CardText>Login</CardText>
        {this.state.error && <Alert color="danger">{this.state.error}</Alert>}
        <FormGroup>
          <label htmlFor="email">E-mail</label>
          <Input
            value={this.state.email}
            onChange={this.handleInputChange}
            type="text"
            name="email"
            id="email"
            onKeyPress={this.handleInputKeyPress}
          />
        </FormGroup>
        <FormGroup>
          <label htmlFor="password">Password</label>
          <Input
            value={this.state.password}
            onChange={this.handleInputChange}
            type="password"
            name="password"
            id="password"
            onKeyPress={this.handleInputKeyPress}
          />
        </FormGroup>
        <p>
          <Button onClick={this.login}>Sign in</Button>
        </p>
      </Fragment>
    )
  }

  renderExternal() {
    return (
      <Fragment>
        <CardTitle>Botpress Admin Panel</CardTitle>
        <CardText>Login</CardText>
        {this.state.error && <Alert color="danger">{this.state.error}</Alert>}
        <p>
          <Button onClick={this.redirectToExternalAuthProvider}>Sign in with SSO</Button>
        </p>
      </Fragment>
    )
  }

  render() {
    if (this.props.auth.isAuthenticated()) {
      return <Redirect to="/" />
    }

    if (this.state.isFirstTimeUse && this.state.authStrategy === 'basic') {
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
                {this.state.authStrategy === 'saml' ? this.renderExternal() : this.renderForm()}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    )
  }
}
