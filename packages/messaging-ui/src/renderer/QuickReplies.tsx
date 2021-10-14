import React, { Component } from 'react'
import * as Keyboard from '../Keyboard'
import { MessageTypeHandlerProps, QuickReply } from '../typings'

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
export class QuickReplies extends Component<MessageTypeHandlerProps<'quick_reply'>> {
  componentDidMount() {
    this.props.config.isLastGroup &&
      this.props.config.isLastOfGroup &&
      this.props.config.store?.composer?.setLocked(!!this.props.payload.disableFreeText)
  }

  componentWillUnmount() {
    this.props.config.store?.composer?.setLocked(false)
  }

  handleButtonClicked = (title: string, payload: any) => {
    this.props.config.onSendData?.({
      type: 'quick_reply',
      text: title,
      payload
    })
    this.props.config.store?.composer?.setLocked(false)
  }

  renderKeyboard(replies: QuickReply[]) {
    return replies.map((reply, idx) => {
      if (Array.isArray(reply)) {
        return <div>{this.renderKeyboard(reply)}</div>
      } else {
        return (
          <Button
            key={idx}
            label={reply.title}
            payload={reply.payload}
            onButtonClick={this.handleButtonClicked}
            onFileUpload={this.props.config.onFileUpload}
          />
        )
      }
    })
  }

  render() {
    const buttons = this.props.payload.quick_replies
    const keyboard = <div className={'bpw-keyboard-quick_reply'}>{buttons && this.renderKeyboard(buttons)}</div>

    return (
      <Keyboard.Prepend keyboard={keyboard} visible={this.props.config.isLastGroup && this.props.config.isLastOfGroup}>
        {this.props.children}
      </Keyboard.Prepend>
    )
  }
}
