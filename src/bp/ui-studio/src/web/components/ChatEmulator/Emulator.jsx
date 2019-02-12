import React from 'react'
import axios from 'axios'
import Promise from 'bluebird'
import SplitPane from 'react-split-pane'
import JSONTree from 'react-json-tree'
import _ from 'lodash'
import nanoid from 'nanoid'
import { Button, Tooltip, OverlayTrigger, Glyphicon } from 'react-bootstrap'
import { HotKeys } from 'react-hotkeys'
import { keyMap } from '~/keyboardShortcuts'
import classnames from 'classnames'
import inspectorTheme from './inspectorTheme'
import Message from './Message'

import style from './Emulator.styl'
import Settings from './Settings'

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
    isVerticalView: true,
    isTypingHidden: true,
    isSettingsOpen: false,
    isSendingRawPayload: false,
    invalidMessage: false
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

  getAxiosConfig() {
    let axiosConfig = { params: { include: 'nlu,state,suggestions,decision,credentials' } }

    if (this.state.externalToken) {
      axiosConfig = {
        ...axiosConfig,
        headers: {
          ExternalAuth: `Bearer ${this.state.externalToken}`
        }
      }
    }

    return axiosConfig
  }

  sendText = async () => {
    if (!this.state.textInputValue.length) {
      return
    }

    const text = this.state.textInputValue
    let messagePayload = { text }

    if (this.state.isSendingRawPayload) {
      try {
        messagePayload = JSON.parse(text)
      } catch (error) {
        console.log('Error while parsing the JSON payload: ', error)
        this.setState({ invalidMessage: true })
        return
      }
    }

    // Wait for state to be set fully to prevent race conditions
    await Promise.fromCallback(cb => this.setState({ textInputValue: '', sending: true, invalidMessage: false }, cb))

    const sentAt = Date.now()
    let msg
    try {
      const res = await axios.post(
        `${window.BOT_API_PATH}/converse/${this.state.userId}/secured`,
        messagePayload,
        this.getAxiosConfig()
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
            hideTyping={this.state.isTypingHidden}
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
        className={classnames(style.msgInput, {
          [style.disabled]: this.state.sending,
          [style.error]: this.state.invalidMessage
        })}
        type="text"
        onKeyPress={this.handleKeyPress}
        onKeyDown={this.handleKeyDown}
        value={this.state.textInputValue}
        placeholder={
          this.state.isSendingRawPayload
            ? 'Type your raw payload here. It must be valid JSON. Ex: {"text": "bla"}'
            : 'Type a message here'
        }
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

  toggleTyping = () => {
    this.setState({ isTypingHidden: !this.state.isTypingHidden })
  }

  hideSettings = () => this.setState({ isSettingsOpen: false })
  displaySettings = () => this.setState({ isSettingsOpen: true })
  updateSettings = newSettings => this.setState({ ...newSettings })

  toggleRawPayload = () => this.setState({ isSendingRawPayload: !this.state.isSendingRawPayload })

  render() {
    const keyHandlers = {
      'emulator-reset': this.handleChangeUserId
    }

    const togglePayload = <Tooltip id="togglePayload">Toggle between sending text or a raw payload</Tooltip>
    const toggleSettings = <Tooltip id="editSettings">Configure Emulator Settings</Tooltip>
    const toggleTyping = <Tooltip id="toggleTyping">Toggle Display of 'Typing' indicator</Tooltip>
    const toggleTooltip = <Tooltip id="toggleTooltip">Toggle View</Tooltip>
    const toggleInspector = <Tooltip id="toggleInspector">Toggle Inspector</Tooltip>
    const newSessionTooltip = <Tooltip id="toggleInspector">Start a new session ({keyMap['emulator-reset']})</Tooltip>

    return (
      <HotKeys handlers={keyHandlers} className={style.container}>
        <div className={style.toolbar}>
          <OverlayTrigger placement="bottom" overlay={newSessionTooltip}>
            <Button onClick={this.handleChangeUserId}>
              <Glyphicon glyph="refresh" /> New session
            </Button>
          </OverlayTrigger>
          <div style={{ float: 'right' }}>
            <OverlayTrigger placement="bottom" overlay={togglePayload}>
              <Button onClick={this.toggleRawPayload}>
                <Glyphicon glyph="comment" />
              </Button>
            </OverlayTrigger>
            <OverlayTrigger placement="bottom" overlay={toggleSettings}>
              <Button onClick={this.displaySettings}>
                <Glyphicon glyph="cog" />
              </Button>
            </OverlayTrigger>
            <OverlayTrigger placement="bottom" overlay={toggleTyping}>
              <Button onClick={this.toggleTyping}>
                <Glyphicon glyph="pencil" />
              </Button>
            </OverlayTrigger>
            <OverlayTrigger placement="bottom" overlay={toggleInspector}>
              <Button onClick={this.toggleInspector}>
                <Glyphicon glyph="search" />
              </Button>
            </OverlayTrigger>
            <OverlayTrigger placement="bottom" overlay={toggleTooltip}>
              <Button onClick={this.toggleView}>
                <Glyphicon glyph="expand" />
              </Button>
            </OverlayTrigger>
          </div>
          <Settings
            userId={this.state.userId}
            externalToken={this.state.externalToken}
            show={this.state.isSettingsOpen}
            onHideSettings={this.hideSettings}
            onUpdateSettings={this.updateSettings}
          />
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
      </HotKeys>
    )
  }
}
