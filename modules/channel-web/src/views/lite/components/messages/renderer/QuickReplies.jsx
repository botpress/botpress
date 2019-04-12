import React, { Component } from 'react'
import { Button } from './Button'
import * as Keyboard from '../../Keyboard'

/**
 * Displays an array of button, and handle when they are clicked
 *
 * @param {object} buttons The list of buttons to display (object with a label and a payload)
 * @param {function} onSendData Called with the required payload to answer the quick reply
 * @param {function} onFileUpload This is called when a file is uploaded
 *
 * @return onSendData is called with the reply
 */
export class QuickReplies extends Component {
  constructor(props) {
    super(props)
  }

  handleButtonClicked = (title, payload) => {
    if (this.props.onSendData) {
      this.props.onSendData({
        type: 'quick_reply',
        text: title,
        payload
      })
    }
  }

  renderKeyboard(buttons) {
    return buttons.map((btn, idx) => {
      if (Array.isArray(btn)) {
        return <div>{this.renderKeyboard(btn)}</div>
      } else {
        // By default, we prevent double clicks on buttons
        const preventDoubleClick = btn.allowMultipleClick === true ? false : true

        return (
          <Button
            key={idx}
            label={btn.label || btn.title}
            payload={btn.payload}
            preventDoubleClick={preventDoubleClick}
            onButtonClick={this.handleButtonClicked}
            onFileUpload={this.props.onFileUpload}
          />
        )
      }
    })
  }

  render() {
    const buttons = this.props.buttons || this.props.quick_replies
    const kbd = <div className={'bpw-keyboard-quick_reply'}>{buttons && this.renderKeyboard(buttons)}</div>

    return (
      <Keyboard.Prepend keyboard={kbd} visible={this.props.isLastGroup && this.props.isLastOfGroup}>
        {this.props.children}
      </Keyboard.Prepend>
    )
  }
}
