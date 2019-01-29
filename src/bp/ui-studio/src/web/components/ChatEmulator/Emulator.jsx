import React from 'react'
import axios from 'axios'
import Promise from 'bluebird'
import SplitPane from 'react-split-pane'
import JSONTree from 'react-json-tree'
import _ from 'lodash'
import nanoid from 'nanoid'
import { Button, Tooltip, OverlayTrigger, Glyphicon } from 'react-bootstrap'

import classnames from 'classnames'

import inspectorTheme from './inspectorTheme'
import Message from './Message'

import style from './Emulator.styl'

const USER_ID_KEY = `bp::${window.BOT_ID}::emulator::userId`
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
    userId: this.getOrCreateUserId(),
    sentHistory: JSON.parse(localStorage.getItem(SENT_HISTORY_KEY) || '[]'),
    sentHistoryIndex: 0,
    isInspectorVisible: true,
    isVerticalView: true
  }

  getOrCreateUserId(forceNew = false) {
    if (!forceNew && localStorage.getItem(USER_ID_KEY)) {
      return localStorage.getItem(USER_ID_KEY)
    }

    const userId = 'emulator_' + nanoid(7)
    localStorage.setItem(USER_ID_KEY, userId)
    return userId
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.isDockOpen && this.props.isDockOpen) {
      this.textInputRef.current.focus()
    }

    if (prevProps.isDockOpen && !this.props.isDockOpen) {
      document.getElementById('main').focus()
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
    let msg
    try {
      const res = await axios.post(
        `${window.BOT_API_PATH}/converse/${this.state.userId}/secured`,
        { text },
        { params: { include: 'nlu,state' } }
      )

      const duration = Date.now() - sentAt
      msg = { duration, sent: text, result: res.data }
    } catch (err) {
      this.setState({ sending: false })
      console.log('Error while sending the message', err)
      return
    }

    // Only append to history if it's not the same as last one
    let newSentHistory = this.state.newSentHistory
    if (_.last(newSentHistory) !== text) {
      newSentHistory = [...this.state.sentHistory, text]
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
      this.sendText()
      e.preventDefault()
    }
  }

  handleKeyDown = e => {
    const maps = { ArrowUp: -1, ArrowDown: 1 }
    if (!e.shiftKey && e.key in maps) {
      e.preventDefault()
      this.navigateSentHistory(maps[e.key])
    }
  }

  handleMsgChange = e => !this.state.sending && this.setState({ textInputValue: e.target.value })

  get inspectorData() {
    return this.state.selectedIndex >= 0 ? this.state.messages[this.state.selectedIndex].result : {}
  }

  handleInspectorShouldExpand(key, data, level) {
    return level <= 1
  }

  handleChangeUserId = () => {
    this.setState(
      {
        messages: [],
        selectedIndex: -1,
        userId: this.getOrCreateUserId(true)
      },
      () => this.textInputRef.current.focus()
    )
  }

  renderHistory() {
    return (
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
    )
  }

  renderInspector() {
    return (
      <div className={style.inspector}>
        <JSONTree
          data={this.inspectorData}
          theme={inspectorTheme}
          invertTheme={false}
          hideRoot={true}
          shouldExpandNode={this.handleInspectorShouldExpand}
        />
      </div>
    )
  }

  renderMessageInput() {
    return (
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
    )
  }

  toggleInspector = () => {
    this.setState({ isInspectorVisible: !this.state.isInspectorVisible })
  }

  toggleView = () => {
    this.setState({ isVerticalView: !this.state.isVerticalView })
  }

  render() {
    const toggleTooltip = <Tooltip id="toggleTooltip">Toggle Display</Tooltip>
    const toggleInspector = <Tooltip id="toggleInspector">Toggle Inspector</Tooltip>

    return (
      <div className={style.container}>
        <div className={style.toolbar}>
          <Button onClick={this.handleChangeUserId}>
            <Glyphicon glyph="refresh" /> New session
          </Button>

          <OverlayTrigger placement="bottom" overlay={toggleInspector}>
            <Button onClick={this.toggleInspector} className={style.pullRight}>
              <Glyphicon glyph="search" />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger placement="bottom" overlay={toggleTooltip}>
            <Button onClick={this.toggleView} className={style.pullRight}>
              <Glyphicon glyph="expand" />
            </Button>
          </OverlayTrigger>
        </div>
        <div className={style.panes}>
          <SplitPane
            split={this.state.isVerticalView ? 'vertical' : 'horizontal'}
            minSize={150}
            defaultSize={'70%'}
            pane2Style={{ overflowY: 'auto', backgroundColor: 'var(--c-background--dark-1)' }}
            pane1ClassName={classnames({ [style.historyFullWidth]: !this.state.isInspectorVisible })}
          >
            {this.renderHistory()}
            {this.renderInspector()}
          </SplitPane>
        </div>
        {this.renderMessageInput()}
      </div>
    )
  }
}
