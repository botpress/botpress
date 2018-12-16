import React from 'react'
import axios from 'axios'
import Promise from 'bluebird'

import { Glyphicon } from 'react-bootstrap'
import classnames from 'classnames'

import Message from './Message'

import style from './Emulator.styl'

export default class EmulatorChat extends React.Component {
  constructor(props) {
    super(props)
    this.textInputRef = React.createRef()
  }

  state = {
    textInputValue: '',
    sending: false,
    messages: []
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.isDockOpen && this.props.isDockOpen) {
      this.textInputRef.current.focus()
    }
  }

  sendText = async () => {
    if (!this.state.textInputValue.length) {
      return
    }

    const text = this.state.textInputValue

    // Wait for state to be set fully to prevent race conditions
    await Promise.fromCallback(cb => this.setState({ textInputValue: '', sending: true }, cb))

    const sentAt = Date.now()
    const res = await axios.post(
      `${window.BOT_API_PATH}/converse/my_user`,
      { text },
      { params: { include: 'nlu,state' } }
    )
    const duration = Date.now() - sentAt

    const msg = { duration, sent: text, result: res.data }
    this.setState({
      messages: [...this.state.messages, msg],
      sending: false,
      selectedIndex: this.state.messages.length
    })
  }

  handleKeyPress = e => {
    if (!e.shiftKey && e.key === 'Enter') {
      e.preventDefault()
      this.sendText()
      return false
    }
  }

  handleMsgChange = e => !this.state.sending && this.setState({ textInputValue: e.target.value })

  render() {
    return (
      <div className={style.container}>
        <div className={style.history}>
          {this.state.messages.map((msg, idx) => (
            <Message
              tabIndex={this.state.messages.length - idx + 1}
              key={`msg-idx`}
              onFocus={() => this.setState({ selectedIndex: idx })}
              selected={this.state.selectedIndex === idx}
              message={msg}
            />
          ))}

          {/* This is used to loop using Tab, we're going back to text input */}
          <div tabIndex={this.state.messages.length + 1} onFocus={() => this.textInputRef.current.focus()} />
        </div>
        <div className={style.inspector}>Inspector here</div>
        <textarea
          tabIndex={1}
          ref={this.textInputRef}
          className={classnames(style.msgInput, { [style.disabled]: this.state.sending })}
          type="text"
          onKeyPress={this.handleKeyPress}
          value={this.state.textInputValue}
          placeholder="Type a message here"
          onChange={this.handleMsgChange}
        />
      </div>
    )
  }
}
