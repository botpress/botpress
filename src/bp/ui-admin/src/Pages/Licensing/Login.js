import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Redirect, Link } from 'react-router-dom'
import { Alert, Col, Button, Input, FormGroup } from 'reactstrap'
import { updateLicensingToken } from '../../modules/license'
import SectionLayout from '../Layouts/Section'
import firebase from '../../utils/firebase'
import api from '../../api'

class Login extends Component {
  state = {
    email: '',
    password: '',
    error: null
  }

  login = async () => {
    this.setState({ error: null })

    firebase
      .auth()
      .signInWithEmailAndPassword(this.state.email, this.state.password)
      .then(res => {
        api.setLicensingToken(res.user.ra)
        this.props.updateLicensingToken(res.user.ra)

        this.setState({ isLoggedIn: true })
      })
      .catch(error => {
        this.setState({
          error: error.message,
          showResetPasswordLink: error.code === 'auth/wrong-password'
        })
      })
  }

  sendResetPassword = () => {
    firebase
      .auth()
      .sendPasswordResetEmail(this.state.email)
      .then(result => {})
      .catch(error => {
        this.setState({ error: error.message })
      })
  }

  handleInputChanged = event => this.setState({ [event.target.name]: event.target.value })
  handleInputKeyPress = e => e.key === 'Enter' && this.login()

  renderResetPassword() {
    return (
      <small>
        Forgot your password?&nbsp;
        <Button color="link" onClick={this.sendResetPassword}>
          Click here
        </Button>
        &nbsp; and we'll send you an email right away to change it.
      </small>
    )
  }

  renderForm = () => {
    if (this.state.isLoggedIn) {
      return <Redirect to={{ pathname: '/licensing/keys' }} />
    }

    return (
      <Col xs="4">
        {this.state.error && <Alert color="danger">{this.state.error}</Alert>}

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

        <p>
          <Button onClick={this.login} size="sm" color="primary">
            Login
          </Button>
          &nbsp;
          <Link to="/licensing/register">
            <Button size="sm">Create an account</Button>
          </Link>
        </p>
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

const mapDispatchToProps = { updateLicensingToken }
export default connect(
  null,
  mapDispatchToProps
)(Login)
