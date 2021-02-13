import React, { Component } from 'react'
import { InjectedIntlProps, injectIntl } from 'react-intl'

import { Renderer } from '../../../typings'

class LoginPromptClass extends Component<Renderer.Message & InjectedIntlProps> {
  state = {
    username: '',
    password: ''
  }

  handleInputChanged = event => this.setState({ [event.target.name]: event.target.value })

  handleFormSubmit = event => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.props.onSendData?.({
      type: 'login_prompt',
      text: 'Provided login information',
      username: this.state.username,
      password: this.state.password,
      sensitive: ['password']
    })

    event.preventDefault()
  }

  render_bot_active() {
    const userName = this.props.intl.formatMessage({
      id: 'loginForm.userName',
      defaultMessage: 'Username'
    })

    const password = this.props.intl.formatMessage({
      id: 'loginForm.password',
      defaultMessage: 'Password'
    })

    const submit = this.props.intl.formatMessage({
      id: 'loginForm.submit',
      defaultMessage: 'Submit'
    })
    return (
      <form className={'bpw-form-container'} onSubmit={this.handleFormSubmit}>
        <label>
          <input
            id="login_username"
            type="input"
            name="username"
            placeholder={userName}
            className="bpw-input"
            onChange={this.handleInputChanged}
          />
        </label>
        <label>
          <input
            id="login_password"
            type="password"
            name="password"
            placeholder={password}
            className="bpw-input"
            onChange={this.handleInputChanged}
          />
        </label>
        <input id="login_submit" className={'bpw-button-alt'} type="submit" value={submit} />
      </form>
    )
  }

  render_bot_past() {
    const formTitle = this.props.intl.formatMessage({
      id: 'loginForm.formTitle',
      defaultMessage: 'Login form'
    })

    return (
      <div className={'bpw-special-action'}>
        <p>* {formTitle} *</p>
      </div>
    )
  }

  render_user() {
    const providedCredentials = this.props.intl.formatMessage({
      id: 'loginForm.providedCredentials',
      defaultMessage: 'Login form'
    })

    return (
      <div className={'bpw-special-action'}>
        <p>* {providedCredentials} *</p>
      </div>
    )
  }

  render() {
    if (!this.props.isBotMessage) {
      return this.render_user()
    }

    if (this.props.isLastMessage) {
      return this.render_bot_active()
    }

    return this.render_bot_past()
  }
}

export const LoginPrompt = injectIntl(LoginPromptClass)
