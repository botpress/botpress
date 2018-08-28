import React, { Component, Fragment } from 'react'
import { Redirect, Link } from 'react-router-dom'
import logo from '../media/nobg_white.png'

import { Alert, Card, CardBody, CardTitle, Button, Input, CardText } from 'reactstrap'

export default class Signup extends Component {
  state = { username: '', password: '', error: null }

  signup = async () => {
    this.setState({ error: null })

    try {
      await this.props.auth.register({ username: this.state.username, password: this.state.password })
    } catch (err) {
      this.setState({ error: err.message })
    }
  }

  onInputChange = name => event => {
    this.setState({ [name]: event.target.value })
  }

  onInputKeyPress = e => {
    if (e.key === 'Enter') {
      this.signup()
    }
  }

  renderForm = () => {
    return (
      <Fragment>
        <CardTitle>Botpress Admin Panel</CardTitle>
        <CardText>Register</CardText>
        {this.state.error && <Alert color="danger">{this.state.error}</Alert>}
        <Input
          value={this.state.username}
          onChange={this.onInputChange('username')}
          type="text"
          name="username"
          id="username"
          onKeyPress={this.onInputKeyPress}
          placeholder="Username"
        />
        <Input
          value={this.state.password}
          onChange={this.onInputChange('password')}
          type="password"
          name="password"
          id="password"
          onKeyPress={this.onInputKeyPress}
          placeholder="Password"
        />
        <p>
          <Button onClick={this.signup}>Sign up</Button>
        </p>
        <p>
          <Link to="/login">Already have an account? Login here.</Link>
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
