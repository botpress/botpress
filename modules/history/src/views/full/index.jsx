import React from 'react'
import style from './style.scss'
import JSONTree from 'react-json-tree'
import 'react-day-picker/lib/style.css'
import DayPickerInput from 'react-day-picker/DayPickerInput'
import { CopyToClipboard } from 'react-copy-to-clipboard'

import inspectorTheme from './inspectortheme'

import classnames from 'classnames'

import { TiRefresh } from 'react-icons/ti'
import { GoX } from 'react-icons/go'
import { MdCloudDownload } from 'react-icons/md'
import { FiLink } from 'react-icons/fi'

function QueryOptions(props) {
  return (
    <div className={style['query-options']}>
      <div>
        <div>from:</div>
        <div className={style['daypicker']}>
          <DayPickerInput value={props.defaultFrom} onDayChange={props.handleFromChange} />
        </div>
      </div>
      <div>
        <div>to:</div>
        <div className={style['daypicker']}>
          <DayPickerInput value={props.defaultTo} onDayChange={props.handleToChange} />
        </div>
      </div>
    </div>
  )
}

function ConversationPicker(props) {
  return (
    <div className={style['conversations']}>
      <QueryOptions
        handleFromChange={props.handleFromChange}
        handleToChange={props.handleToChange}
        defaultFrom={props.defaultFrom}
        defaultTo={props.defaultTo}
      />
      <div className={style['conversations-titlebar']}>
        <div>Conversations</div>
        <TiRefresh className={style['conversations-refresh']} onClick={props.refresh} />
      </div>
      <div>
        {props.conversations.map(conv => {
          return (
            <div className={style['conversations-entry']} onClick={() => props.conversationChosenHandler(conv.id)}>
              <span className={style['conversations-text']} key={conv.id} value={conv.id}>
                {`conversation #${conv.id}`}
              </span>
              <span className={style['conversations-count']}>({conv.count})</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

class MessagesViewer extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      inspectorIsShown: false,
      currentlyFocusedMessage: null
    }
  }

  getLastMessageDate = messages => {
    return new Date(Math.max(...messages.map(m => new Date(m.createdOn))))
  }

  closeInspector = () => {
    this.setState({ inspectorIsShown: false })
  }

  focusMessage(m) {
    this.setState({ currentlyFocusedMessage: m, inspectorIsShown: true })
  }

  render() {
    return (
      <div className={style['message-viewer']}>
        <div
          className={classnames(
            style['message-list'],
            this.state.inspectorIsShown ? style['message-list-partial'] : style['message-list-full']
          )}
        >
          <div className={style['message-header']}>
            <div>
              {this.props.convId && <div className={style['message-title']}>Conversation #{this.props.convId}</div>}
              {this.props.convId && (
                <div className={style['message-lastdate']}>
                  Last message on : #{this.getLastMessageDate(this.props.messages).toDateString()}
                </div>
              )}
            </div>
            <div className={style['message-header-icons']}>
              <div className={style['message-header-icon_item']}>
                <a href={this.props.fileURL} download="message_history">
                  <MdCloudDownload size={40} />
                </a>
              </div>
              <div className={style['message-header-icon_item']}>
                <CopyToClipboard text={window.location.href} onCopy={() => console.log(window.location.href)}>
                  <FiLink size={40} />
                </CopyToClipboard>
              </div>
            </div>
          </div>
          {this.props.messages &&
            this.props.messages.map(m => {
              return (
                <div
                  className={classnames(
                    style['message-elements'],
                    m.direction === 'outgoing' ? style['message-outgoing'] : style['message-incomming']
                  )}
                  key={`${m.id}: ${m.direction}`}
                  value={m.id}
                  onClick={() => this.focusMessage(m)}
                >
                  > {m.payload.text}
                </div>
              )
            })}
        </div>
        <div
          className={classnames(
            style['message-inspector'],
            this.state.inspectorIsShown ? '' : style['message-inspector-hidden']
          )}
        >
          <div className={style['quit-inspector']} onClick={this.closeInspector}>
            <GoX />
          </div>
          {this.state.currentlyFocusedMessage && (
            <JSONTree
              theme={inspectorTheme}
              data={this.state.currentlyFocusedMessage}
              invertTheme={false}
              hideRoot={true}
            />
          )}
        </div>
      </div>
    )
  }
}

export default class FullView extends React.Component {
  constructor(props) {
    super(props)

    const blob = new Blob([''], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)

    this.state = {
      conversations: [],
      messages: [],
      to: new Date(Date.now()),
      from: this.offsetDate(Date.now(), -20),
      currentConvId: null,
      fileBlob: blob,
      fileURL: url
    }
  }

  threadIdParamName = 'threadId'

  offsetDate(date, offset) {
    const newDate = new Date(date)
    newDate.setDate(newDate.getDate() + offset)
    return newDate
  }

  componentDidMount() {
    this.getConversations(this.state.from, this.state.to)
    const url = new URL(window.location.href)
    const threadId = url.searchParams.get(this.threadIdParamName)
    if (threadId) {
      this.setState({ currentConvId: threadId })
      this.getMessagesOfConversation(threadId)
    }
  }

  getConversations(from, to) {
    const ceiledToDate = this.offsetDate(to, 1)

    this.props.bp.axios
      .get(`/mod/history/conversations/${from.getTime()}/${ceiledToDate.getTime()}`)
      .then(({ data }) => {
        this.setState({ conversations: data })
      })
  }

  onConversationSelected(convId) {
    const url = new URL(window.location.href)
    url.searchParams.set(this.threadIdParamName, convId)
    window.history.pushState(window.history.state, '', url.toString())

    this.setState({ currentConvId: convId })

    this.getMessagesOfConversation(convId)
  }

  getMessagesOfConversation(convId) {
    this.props.bp.axios.get(`/mod/history/messages/${convId}`).then(({ data }) => {
      const content = JSON.stringify(data)
      var blob = new Blob([content], { type: 'application/json' })
      var url = window.URL.createObjectURL(blob)

      this.setState({ messages: data, fileBlob: blob, fileURL: url })
    })
  }

  render() {
    if (!this.state.conversations) {
      return null
    }
    return (
      <div className={style['history-component']}>
        <ConversationPicker
          conversations={this.state.conversations}
          conversationChosenHandler={this.onConversationSelected.bind(this)}
          handleFromChange={day => {
            this.setState({ from: day })
            this.getConversations(day, this.state.to)
          }}
          handleToChange={day => {
            this.setState({ to: day })
            this.getConversations(this.state.from, day)
          }}
          defaultFrom={this.state.from}
          defaultTo={this.state.to}
          refresh={() => this.getConversations(this.state.from, this.state.to)}
        />
        <MessagesViewer convId={this.state.currentConvId} messages={this.state.messages} fileURL={this.state.fileURL} />
      </div>
    )
  }
}
