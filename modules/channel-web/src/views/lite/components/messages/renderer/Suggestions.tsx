import React, { Component, Fragment } from 'react'

import { Renderer } from '../../../typings'
import * as Keyboard from '../../Keyboard'

import { Button } from './Button'

/**
 * Displays an array of button, and handle when they are clicked
 *
 * @param {object} buttons The list of buttons to display (object with a label and a payload)
 * @param {function} onSendData Called with the required payload to answer the quick reply
 * @param {function} onFileUpload This is called when a file is uploaded
 *
 * @return onSendData is called with the reply
 */
export class Suggestions extends Component<Renderer.QuickReply> {
  state = {
    clickedButtons: [],
    display: false
  }

  componentDidMount() {
    // Required otherwise the component mounts too fast (before the keyboard)
    setTimeout(() => {
      this.setState({ display: true })
    }, 100)
  }

  handleButtonClicked = (title, payload) => {
    // tslint:disable-next-line: no-floating-promises
    this.props.onSendData?.({
      type: 'quick_reply',
      text: title,
      payload
    })
  }

  renderKeyboard(buttons: Renderer.QuickReplyButton[]) {
    return (
      <div className="bpw-quick_reply-buttons-container">
        {buttons.map((btn, idx) => {
          if (Array.isArray(btn)) {
            return this.renderKeyboard(btn)
          } else {
            return (
              <Button
                key={btn.label}
                label={(btn.label || btn.title)?.toString()}
                payload={btn.payload || btn['value']}
                preventDoubleClick={!btn.allowMultipleClick}
                onButtonClick={this.handleButtonClicked}
                onFileUpload={this.props.onFileUpload}
              />
            )
          }
        })}
      </div>
    )
  }

  render() {
    const suggestions = this.props.suggestions
    if (!suggestions?.length || !this.state.display) {
      return null
    }

    if (this.props.position === 'conversation') {
      return this.renderKeyboard(suggestions)
    }

    const kbd = (
      <div className={'bpw-keyboard-quick_reply'}>{<Fragment>{this.renderKeyboard(suggestions)}</Fragment>}</div>
    )

    return (
      <Keyboard.Prepend keyboard={kbd} visible={true}>
        {this.props.children}
      </Keyboard.Prepend>
    )
  }
}
