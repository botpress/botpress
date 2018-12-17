import React from 'react'
import axios from 'axios'
import Promise from 'bluebird'
import SplitPane from 'react-split-pane'
import JSONTree from 'react-json-tree'
import _ from 'lodash'

import classnames from 'classnames'

import inspectorTheme from './inspectorTheme'
import Message from './Message'

import style from './Emulator.styl'

const SENT_HISTORY_KEY = `bp::${window.BOT_ID}::emulator::sentHistory`
const SENT_HISTORY_SIZE = 20

export default class EmulatorChat extends React.Component {
  constructor(props) {
    super(props)
    this.textInputRef = React.createRef()
    this.endOfMessagesRef = React.createRef()
  }

  state = {
    textInputValue: '',
    sending: false,
    messages: [],
    sentHistory: JSON.parse(localStorage.getItem(SENT_HISTORY_KEY) || '[]'),
    sentHistoryIndex: 0
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.isDockOpen && this.props.isDockOpen) {
      this.textInputRef.current.focus()
    }
  }

  navigateSentHistory(step) {
    if (!this.state.sentHistory.length) {
      return
    }

    let newIndex = this.state.sentHistoryIndex + step

    if (newIndex < 0) {
      newIndex = this.state.sentHistory.length - 1
    } else if (newIndex >= this.state.sentHistory.length) {
      newIndex = 0
    }

    this.setState({
      textInputValue: this.state.sentHistory[newIndex],
      sentHistoryIndex: newIndex
    })
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

    // Only append to history if it's not the same as last one
    const newSentHistory = [...this.state.sentHistory]
    if (_.last(newSentHistory) !== text) {
      newSentHistory.push(text)
    }

    this.setState(
      {
        messages: [...this.state.messages, msg],
        sending: false,
        selectedIndex: this.state.messages.length,
        sentHistory: newSentHistory,
        sentHistoryIndex: 0
      },
      () => localStorage.setItem(SENT_HISTORY_KEY, JSON.stringify(_.take(this.state.sentHistory, SENT_HISTORY_SIZE)))
    )

    this.endOfMessagesRef.current.scrollIntoView(false)
  }

  handleKeyPress = e => {
    if (!e.shiftKey && e.key === 'Enter') {
      e.preventDefault()
      this.sendText()
      return false
    }
  }

  handleKeyDown = e => {
    const maps = { ArrowUp: -1, ArrowDown: 1 }
    if (!e.shiftKey && e.key in maps) {
      e.preventDefault()
      this.navigateSentHistory(maps[e.key])
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
                  key={`msg-${idx}`}
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
          onKeyDown={this.handleKeyDown}
          value={this.state.textInputValue}
          placeholder="Type a message here"
          onChange={this.handleMsgChange}
        />
      </div>
    )
  }
}
