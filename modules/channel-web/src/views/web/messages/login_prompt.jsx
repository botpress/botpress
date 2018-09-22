import React, { Component } from 'react'

import { hexToRGBA } from './misc'

import style from './style.scss'

class LoginPrompt extends Component {
  constructor(props) {
    super(props)
    this.state = {
      username: '',
      password: ''
    }
  }

  handleChange(field) {
    return e => {
      this.setState({ [field]: e.target.value })
    }
  }

  handleSubmit(event) {
    if (this.props.onLoginPromptSend) {
      this.props.onLoginPromptSend(this.state.username, this.state.password)
    }

    event.preventDefault()
  }

  render_bot_active() {
    const buttonBackgroundColor = hexToRGBA(this.props.bgColor, 1)
    const buttonTextColor = hexToRGBA(this.props.textColor, 1)

    const fieldTextColor = hexToRGBA(this.props.bgColor, 0.7)
    const usernameLineColor = hexToRGBA(this.props.bgColor, 0.07)
    const passwordLineColor = hexToRGBA(this.props.bgColor, 0.07)

    return (
      <form className={style.loginPromptContainer} onSubmit={::this.handleSubmit}>
        <label>
          <input
            style={{ 'border-bottom-color': usernameLineColor, color: fieldTextColor }}
            className={style.loginInput}
            type="input"
            placeholder="Username"
            onChange={::this.handleChange('username')}
          />
        </label>
        <label>
          <input
            style={{ 'border-bottom-color': passwordLineColor, color: fieldTextColor }}
            className={style.loginInput}
            type="password"
            placeholder="Password"
            onChange={::this.handleChange('password')}
          />
        </label>
        <input
          style={{ 'background-color': buttonBackgroundColor, color: buttonTextColor }}
          className={style.loginButton}
          type="submit"
          value="Submit"
        />
      </form>
    )
  }

  render_bot_past() {
    return (
      <div className={style.specialAction}>
        <p>* Login form *</p>
      </div>
    )
  }

  render_user() {
    return (
      <div className={style.specialAction}>
        <p>* Provided credentials *</p>
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

export default LoginPrompt
