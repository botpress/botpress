import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { Button, FormGroup, FormControl, ControlLabel, HelpBlock } from 'react-bootstrap'
import classnames from 'classnames'

import styles from './style.scss'
import { login } from '~/util/Auth'

import Decorators from '+/views/Login/Decorators.jsx'

export default class LoginPage extends Component {
  static contextTypes = {
    router: PropTypes.object
  }

  constructor(props, context) {
    super(props, context)
    this.state = {
      user: 'admin',
      password: '',
      error: null,
      loading: false
    }
  }

  componentDidMount() {
    Decorators.LoginInitialization && Decorators.LoginInitialization(this)
    const app = document.getElementById('app')
    app.className = classnames(app.className, 'bp-body-login')
  }

  handlePasswordChange(event) {
    this.setState({ password: event.target.value })
  }

  handleUserChange(event) {
    this.setState({ user: event.target.value })
  }

  handleSubmit(event) {
    event.preventDefault()
    this.setState({ loading: true })

    login(this.state.user, this.state.password)
      .then(result => {
        this.setState({ error: null })
        this.context.router.push(this.props.location.query.returnTo || '/')
      })
      .catch(err => {
        this.setState({ error: err.message, loading: false })
      })
  }

  renderLoading() {
    const className = classnames(styles.loading, 'bp-loading')
    return (
      this.state.loading && (
        <div className={className}>
          <div
            style={{
              marginTop: '140px'
            }}
            className="whirl helicopter"
          />
        </div>
      )
    )
  }

  componentWillUnmount() {
    const app = document.getElementById('app')
    app.className = classnames(app.className.replace('bp-body-login', ''))
  }

  render() {
    const hasChangedPassword = !!this.props.location.query.reset
    const hasAnError = !!this.state.error

    const tallPanelStyle = hasChangedPassword || hasAnError

    const panelStyle = classnames('panel')

    const blockStyle = classnames('bp-login', styles['panel-center'], {
      [styles['panel-center-tall']]: tallPanelStyle
    })

    const logoStyle = classnames('bp-logo', styles['logo'])

    const headerStyle = classnames('panel-heading', 'text-center', styles.header, 'bp-header')
    const errorStyle = classnames(styles.error)
    const successStyle = classnames(styles.success)

    return (
      <div>
        <div className="block-center mt-xl wd-xl">
          <div className={blockStyle}>
            <div className={logoStyle}>
              <img src="/img/logo_grey.png" />
            </div>
            <div className={panelStyle}>
              <div className={headerStyle}>
                <h4>Login</h4>
              </div>
              <div className="panel-body">
                {this.renderLoading()}
                {this.state.error && <p className={errorStyle}>{this.state.error}</p>}
                {hasChangedPassword && <p className={successStyle}>Password changed successfully</p>}
                <form onSubmit={this.handleSubmit.bind(this)}>
                  <FormGroup>
                    <ControlLabel>User</ControlLabel>
                    <Decorators.User value={this.state.user} onChange={::this.handleUserChange} />
                  </FormGroup>
                  <FormGroup>
                    <ControlLabel>Password</ControlLabel>
                    <FormControl
                      type="password"
                      placeholder=""
                      value={this.state.password}
                      onChange={::this.handlePasswordChange}
                    />
                  </FormGroup>
                  <Button className="pull-right" type="submit">
                    Login
                  </Button>
                  <Decorators.ForgotPassword />
                </form>
              </div>{' '}
              {/* End Panel Body */}
            </div>{' '}
            {/* End Panel */}
          </div>{' '}
          {/* End Block */}
        </div>
      </div>
    )
  }
}
