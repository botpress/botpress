import React, { Component } from 'react'
import { MessageTypeHandlerProps } from '../typings'

interface IState {
  username: string
  password: string
}

export class LoginPrompt extends Component<MessageTypeHandlerProps<'login_prompt'>, IState> {
  state = {
    username: '',
    password: ''
  }

  handleInputChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    if (name === 'username' || name === 'password') {
      this.setState({ ...this.state, [name]: value })
    }
  }

  handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    await this.props.config.onSendData?.({
      type: 'login_prompt',
      text: 'Provided login information',
      username: this.state.username,
      password: this.state.password,
      sensitive: ['password']
    })

    event.preventDefault()
  }

  render_bot_active() {
    const userName = this.props.config.intl.formatMessage({
      id: 'loginForm.userName',
      defaultMessage: 'Username'
    })

    const password = this.props.config.intl.formatMessage({
      id: 'loginForm.password',
      defaultMessage: 'Password'
    })

    const submit = this.props.config.intl.formatMessage({
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
    const formTitle = this.props.config.intl.formatMessage({
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
    const providedCredentials = this.props.config.intl.formatMessage({
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
    if (!this.props.config.isBotMessage) {
      return this.render_user()
    }

    if (this.props.config.isLastGroup && this.props.config.isLastOfGroup) {
      return this.render_bot_active()
    }

    return this.render_bot_past()
  }
}
