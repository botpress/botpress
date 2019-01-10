import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import { Alert, Col, Button, Input, FormGroup } from 'reactstrap'
import SectionLayout from '../Layouts/Section'
import { register, isAuthenticated } from '../../Auth/licensing'

export default class Register extends Component {
  state = {
    email: '',
    password: '',
    error: null,
    isLoading: false
  }

  register = async () => {
    this.setState({ error: null, isLoading: true })

    try {
      await register({
        email: this.state.email,
        password: this.state.password
      })

      this.forceUpdate()
    } catch (error) {
      this.setState({
        error: error.message,
        isLoading: false
      })
    }
  }

  handleInputChanged = event => this.setState({ [event.target.name]: event.target.value })
  handleInputKeyPress = e => e.key === 'Enter' && this.register()

  renderForm = () => {
    if (isAuthenticated()) {
      return <Redirect to="/licensing/keys" />
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

        <Button
          onClick={this.register}
          disabled={!this.state.email.length || !this.state.password.length || this.state.isLoading}
          size="sm"
          color="primary"
        >
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
