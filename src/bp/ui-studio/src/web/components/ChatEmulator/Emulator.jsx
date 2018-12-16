import React from 'react'
import axios from 'axios'
import Promise from 'bluebird'
import SplitPane from 'react-split-pane'
import JSONTree from 'react-json-tree'

import { Glyphicon } from 'react-bootstrap'
import classnames from 'classnames'

import inspectorTheme from './inspectorTheme'
import Message from './Message'

import style from './Emulator.styl'

export default class EmulatorChat extends React.Component {
  constructor(props) {
    super(props)
    this.textInputRef = React.createRef()
    this.endOfMessagesRef = React.createRef()
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

    this.endOfMessagesRef.current.scrollIntoView(false)
  }

  handleKeyPress = e => {
    if (!e.shiftKey && e.key === 'Enter') {
      e.preventDefault()
      this.sendText()
      return false
    }
  }

  handleMsgChange = e => !this.state.sending && this.setState({ textInputValue: e.target.value })

  get inspectorData() {
    return this.state.selectedIndex >= 0 ? this.state.messages[this.state.selectedIndex].result : {}
  }

  inspectorShouldExpand(key, data, level) {
    return level <= 1
  }

  render() {
    return (
      <div className={style.container}>
        <div className={style.panes}>
          <SplitPane
            split="horizontal"
            minSize={50}
            defaultSize={'75%'}
            pane2Style={{ 'overflow-y': 'auto', backgroundColor: '#272822' }}
          >
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
              {/* Also used to scroll to the end of the messages */}
              <div
                ref={this.endOfMessagesRef}
                tabIndex={this.state.messages.length + 1}
                onFocus={() => this.textInputRef.current.focus()}
              />
            </div>
            <div className={style.inspector}>
              <JSONTree
                data={this.inspectorData}
                theme={inspectorTheme}
                invertTheme={false}
                hideRoot={true}
                shouldExpandNode={this.inspectorShouldExpand}
              />
            </div>
          </SplitPane>
        </div>
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
