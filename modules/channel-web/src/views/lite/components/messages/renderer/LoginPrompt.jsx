import React, { Component } from 'react'

export class LoginPrompt extends Component {
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
    return (
      <form className={'bpw-form-container'} onSubmit={this.handleFormSubmit}>
        <label>
          <input
            id="login_username"
            type="input"
            name="username"
            placeholder="Username"
            className="bpw-input"
            onChange={this.handleInputChanged}
          />
        </label>
        <label>
          <input
            id="login_password"
            type="password"
            name="password"
            placeholder="Password"
            className="bpw-input"
            onChange={this.handleInputChanged}
          />
        </label>
        <input id="login_submit" className={'bpw-button-alt'} type="submit" value="Submit" />
      </form>
    )
  }

  render_bot_past() {
    return (
      <div className={'bpw-special-action'}>
        <p>* Login form *</p>
      </div>
    )
  }

  render_user() {
    return (
      <div className={'bpw-special-action'}>
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
