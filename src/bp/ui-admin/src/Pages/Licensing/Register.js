import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Redirect } from 'react-router-dom'
import { Alert, Col, Button, Input, FormGroup } from 'reactstrap'
import { updateLicensingAccount } from '../../modules/license'
import SectionLayout from '../Layouts/Section'
import firebase from '../../utils/firebase'
import api from '../../api'

class Register extends Component {
  state = {
    email: '',
    password: '',
    error: null
  }

  register = async () => {
    firebase
      .auth()
      .createUserWithEmailAndPassword(this.state.email, this.state.password)
      .then(result => {
        const user = {
          email: result.user.email,
          name: result.user.displayName,
          token: result.user.ra
        }

        firebase.auth().currentUser.sendEmailVerification()

        api.setLicensingToken(user.token)
        this.props.updateLicensingAccount(user)
        this.setState({ isLoggedIn: true })
      })
      .catch(error => {
        this.setState({ error: error.message })
      })
  }

  handleInputChanged = event => this.setState({ [event.target.name]: event.target.value })
  handleInputKeyPress = e => e.key === 'Enter' && this.register()

  renderForm = () => {
    if (this.state.isLoggedIn) {
      return <Redirect to={{ pathname: '/licensing/keys' }} />
    }

    return (
      <Col xs="3">
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

        <Button onClick={this.register} size="sm" color="primary">
          Create my account
        </Button>
      </Col>
    )
  }

  render() {
    return (
      <SectionLayout
        title="Register to Botpress Licensing Server"
        activePage="licensing-register"
        mainContent={this.renderForm()}
      />
    )
  }
}

const mapDispatchToProps = { updateLicensingAccount }
export default connect(
  null,
  mapDispatchToProps
)(Register)
