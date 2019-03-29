import React, { Component } from 'react'
import { Button } from './Button'
import { asyncDebounce } from '../../../utils'

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
    this.quickReplyDebounce = asyncDebounce(1000)
  }

  handleSendQuickReply = (title, payload) => {
    if (this.props.onSendData) {
      this.props.onSendData({
        type: 'quick_reply',
        text: title,
        data: { payload }
      })
    }
  }

  handleFileUpload = file => {
    this.props.onFileUpload && this.props.onFileUpload(file)
  }

  renderButtons() {
    if (!this.props.buttons) {
      return null
    }

    return (
      <div className={'bpw-bubble-quick_reply'}>
        {this.props.buttons.map((btn, idx) => (
          <Button
            key={idx}
            label={btn.label || btn.title}
            payload={btn.payload}
            onButtonClick={this.handleSendQuickReply}
            onFileUpload={this.handleFileUpload}
          />
        ))}
      </div>
    )
  }

  render() {
    return (
      <div>
        {this.props.children}
        {this.props.isLastGroup && this.renderButtons()}
      </div>
    )
  }
}
