import React, { Component } from 'react'
import { injectIntl, FormattedMessage } from 'react-intl'

class Composer extends Component {
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
    if (this.props.config && this.props.config.enableArrowNavigation) {
      const shouldFocusPrevious = e.target.selectionStart === 0 && (e.key === 'ArrowUp' || e.key === 'ArrowLeft')
      if (shouldFocusPrevious) {
        this.props.focusPrevious()
      }

      const shouldFocusNext =
        e.target.selectionStart === this.textInput.value.length && (e.key === 'ArrowDown' || e.key === 'ArrowRight')
      if (shouldFocusNext) {
        this.props.focusNext()
      }
    } else if (e.key == 'ArrowUp' || e.key == 'ArrowDown') {
      this.props.recallHistory(e.key)
    }
  }

  render() {
    return (
      <div className={'bpw-composer'}>
        <div className={'bpw-composer-inner'}>
          <textarea
            tabIndex="1"
            ref={input => {
              this.textInput = input
            }}
            onFocus={this.props.onFocus}
            placeholder={this.props.placeholder}
            onChange={this.props.change}
            value={this.props.text}
            onKeyPress={this.handleKeyPress}
            onKeyDown={this.handleKeyDown}
          />
          <button className={'bpw-send-button'} disabled={!this.props.text.length} onClick={this.props.send}>
            <FormattedMessage id="composer.send" />
          </button>
        </div>
      </div>
    )
  }
}

export default injectIntl(Composer)
