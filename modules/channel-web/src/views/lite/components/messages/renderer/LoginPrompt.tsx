import React, { Component } from 'react'
import { InjectedIntlProps, injectIntl } from 'react-intl'

import { Renderer } from '../../../typings'

export class LoginPrompt extends Component<Renderer.Message> {
  state = {
    username: '',
    password: ''
  }

  handleInputChanged = event => this.setState({ [event.target.name]: event.target.value })

  handleFormSubmit = event => {
    this.props.onSendData &&
      this.props.onSendData({
        type: 'login_prompt',
        text: 'Provided login information',
        username: this.state.username,
        password: this.state.password,
        sensitive: ['password']
      })

    event.preventDefault()
  }

  render_bot_active() {
    const TranslatedBlock = injectIntl(({ intl }: InjectedIntlProps) => {
      const userName = intl.formatMessage({
        id: 'loginForm.userName',
        defaultMessage: 'Username'
      })
      const password = intl.formatMessage({
        id: 'loginForm.password',
        defaultMessage: 'Password'
      })
      const submit = intl.formatMessage({
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
    })

    return <TranslatedBlock />
  }

  render_bot_past() {
    const TranslatedBlock = injectIntl(({ intl }: InjectedIntlProps) => {
      const formTitle = intl.formatMessage({
        id: 'loginForm.formTitle',
        defaultMessage: 'Login form'
      })

      return (
        <div className={'bpw-special-action'}>
          <p>* {formTitle} *</p>
        </div>
      )
    })

    return <TranslatedBlock />
  }

  render_user() {
    const TranslatedBlock = injectIntl(({ intl }: InjectedIntlProps) => {
      const providedCredentials = intl.formatMessage({
        id: 'loginForm.providedCredentials',
        defaultMessage: 'Login form'
      })

      return (
        <div className={'bpw-special-action'}>
          <p>* {providedCredentials} *</p>
        </div>
      )
    })

    return <TranslatedBlock />
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
