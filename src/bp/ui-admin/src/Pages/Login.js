import React, { Component, Fragment } from 'react'
import { Redirect } from 'react-router-dom'
import logo from '../media/nobg_white.png'
import api from '../api'
import { Alert, Card, CardBody, CardTitle, Button, Input, FormGroup, CardText } from 'reactstrap'

export default class Login extends Component {
  state = {
    isFirstTimeUse: false,
    email: '',
    password: '',
    passwordExpired: false,
    error: null
  }

  loadAuthConfig = async () => {
    const { data } = await api.getAnonymous().get('/auth/config')

    this.setState({ isFirstTimeUse: data.payload.isFirstTimeUse })
  }

  componentDidMount() {
    this.loadAuthConfig()
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

  handleInputChange = e => this.setState({ [e.target.name]: e.target.value })
  handleInputKeyPress = e => e.key === 'Enter' && this.login()

  renderForm = () => {
    return (
      <Fragment>
        <CardTitle>Botpress Admin Panel</CardTitle>
        <CardText>Login</CardText>
        {this.state.error && <Alert color="danger">{this.state.error}</Alert>}
        <FormGroup>
          <label htmlFor="email">email</label>
          <Input
            value={this.state.email}
            onChange={this.handleInputChange}
            type="text"
            name="email"
            id="email"
            onKeyPress={this.onInputKeyPress}
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
            onKeyPress={this.onInputKeyPress}
          />
        </FormGroup>
        <p>
          <Button onClick={this.login}>Sign in</Button>
        </p>
      </Fragment>
    )
  }

  render() {
    if (this.props.auth.isAuthenticated()) {
      return <Redirect to="/" />
    }

    if (this.state.isFirstTimeUse) {
      return <Redirect to="/register" />
    }

    if (this.state.passwordExpired) {
      return <Redirect to={{ pathname: '/ChangePassword', state: this.state }} />
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
