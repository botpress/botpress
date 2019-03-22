import React, { Component } from 'react'

import style from './style.scss'

export default class Send extends Component {
  componentDidMount() {
    this.textInput.focus()
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.focused && this.props.focused) {
      this.textInput.focus()
    }
  }

  handleKeyPress = e => {
    if (e.key === 'Enter') {
      this.props.send()
      e.preventDefault()
    }
  }

  handleKeyDown = e => {
    const shouldBlurPrevious = e.target.selectionStart === 0 && (e.key === 'ArrowUp' || e.key === 'ArrowLeft')
    const shouldBurNext = e.target.selectionStart === 0 && (e.key === 'ArrowDown' || e.key === 'ArrowRight')

    // We might want to act differently if we blur prev or blur next
    if (shouldBlurPrevious || shouldBurNext) {
      this.textInput.blur()
      this.props.onBlurByKeys()
    }
  }

  render() {
    return (
      <div className={style.input}>
        <textarea
          tabindex="1"
          ref={input => {
            this.textInput = input
          }}
          onBlur={this.props.onBlur}
          onFocus={this.props.onFocus}
          placeholder={this.props.placeholder}
          onChange={this.props.change}
          value={this.props.text}
          onKeyPress={this.handleKeyPress}
          onKeyDown={this.handleKeyDown}
          style={{
            color: this.props.config.textColorOnBackground
          }}
        />
      </div>
    )
  }
}
