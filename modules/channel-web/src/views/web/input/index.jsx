import React, { Component } from 'react'

import style from './style.scss'

export default class Send extends Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    this.textInput.focus()
  }

  handleFocus(value) {
    if (this.props.focused) {
      this.props.focused(value)
    }
  }

  handleKeyPress(e) {
    if (e.key === 'Enter') {
      this.props.send()
      e.preventDefault()
    }
  }

  render() {
    return (
      <div tabIndex="-1" className={style.input}>
        <textarea
          tabIndex="1"
          ref={input => {
            this.textInput = input
          }}
          onBlur={() => this.handleFocus(false)}
          onFocus={() => this.handleFocus(true)}
          placeholder={this.props.placeholder}
          onChange={this.props.change}
          value={this.props.text}
          onKeyPress={::this.handleKeyPress}
          style={{
            color: this.props.config.textColorOnBackground
          }}
        />
      </div>
    )
  }
}
