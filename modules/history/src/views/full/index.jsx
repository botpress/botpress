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
import { MdFileDownload } from 'react-icons/md'
import { FiLink } from 'react-icons/fi'
import { MdSearch } from 'react-icons/md'
import { FaFilter } from 'react-icons/fa'

function QueryOptions(props) {
  return (
    <div className={style['query-options']}>
      <div className={style['query-options-daypick']}>
        <div className={style['query-options-from_to']}>from:</div>
        <div className={style['daypicker-item']}>
          <DayPickerInput value={props.defaultFrom} onDayChange={props.handleFromChange} />
        </div>
      </div>
      <div className={style['query-options-daypick']}>
        <div className={style['query-options-from_to']}>to:</div>
        <div className={style['daypicker-item']}>
          <DayPickerInput value={props.defaultTo} onDayChange={props.handleToChange} />
        </div>
      </div>
    </div>
  )
}

class ConversationPicker extends React.Component {
  state = {
    displayQueryOptions: false
  }

  toggleFilters() {
    this.setState({ displayQueryOptions: !this.state.displayQueryOptions })
  }

  render() {
    return (
      <div className={style['conversations']}>
        <div className={style['conversations-titlebar']}>
          <div>Conversations</div>
          <div className={style['conversations-icons']}>
            <FaFilter className={style['conversations-filter']} onClick={this.toggleFilters.bind(this)} />
            <TiRefresh className={style['conversations-refresh']} onClick={this.props.refresh} />
          </div>
        </div>
        {this.state.displayQueryOptions && (
          <QueryOptions
            handleFromChange={this.props.handleFromChange}
            handleToChange={this.props.handleToChange}
            defaultFrom={this.props.defaultFrom}
            defaultTo={this.props.defaultTo}
          />
        )}
        <div>
          {this.props.conversations.map(conv => {
            return (
              <div
                className={style['conversations-entry']}
                onClick={() => this.props.conversationChosenHandler(conv.id)}
              >
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
}

class MessagesViewer extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      inspectorIsShown: false,
      currentlyFocusedMessage: null
    }
  }

  getLastMessageDate = messageGroups => {
    const messages = messageGroups.flatMap(m => m)
    return new Date(Math.max(...messages.map(m => new Date(m.createdOn))))
  }

  closeInspector = () => {
    this.setState({ inspectorIsShown: false })
  }

  focusMessage(m) {
    this.setState({ currentlyFocusedMessage: m, inspectorIsShown: true })
  }

  render() {
    if (!this.props.convId || this.props.messageGroups.length <= 0) {
      return <NoConversationSelected />
    }
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
                  Last message on : #{this.getLastMessageDate(this.props.messageGroups).toDateString()}
                </div>
              )}
            </div>
            <div className={style['message-header-icons']}>
              <div className={style['message-header-icon_item']}>
                <a
                  href={this.props.fileURL}
                  download="message_history"
                  style={{
                    color: '#233abc'
                  }}
                >
                  <MdFileDownload />
                </a>
              </div>
              <div className={style['message-header-icon_item']}>
                <CopyToClipboard text={window.location.href}>
                  <FiLink />
                </CopyToClipboard>
              </div>
            </div>
          </div>
          {this.props.messageGroups &&
            this.props.messageGroups.map(group => {
              return <MessageGroup messages={group} focusMessage={this.focusMessage.bind(this)} />
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

function MessageGroup(props) {
  const messages = [...props.messages]
  if (!messages) {
    return null
  }

  const userMessageIndex = messages.findIndex(m => m.direction === 'incoming')
  const userMessage = messages[userMessageIndex]
  messages.splice(userMessageIndex, 1)

  return (
    <div className={style['message-group']}>
      <div className={style['message-group-header']}>
        <div>
          <span style={{ 'font-weight': 'bold' }}>{`${userMessage.decision.confidence * 100}% decision:`}</span>
          <span>{` ${userMessage.decision.sourceDetails}`}</span>
        </div>
        <div className={style['message-inspect']} onClick={() => props.focusMessage(userMessage)}>
          <MdSearch />
        </div>
      </div>
      <div className={style['message-sender']}>User:</div>
      {userMessage && (
        <div className={classnames(style['message-elements'], style['message-incomming'])}>{userMessage.preview}</div>
      )}
      <div className={style['message-sender']}>Bot:</div>
      {messages.map(m => {
        return (
          <div
            className={classnames(
              style['message-elements'],
              m.direction === 'outgoing' ? style['message-outgoing'] : style['message-incomming']
            )}
            key={`${m.id}: ${m.direction}`}
            value={m.id}
          >
            {m.preview}
          </div>
        )
      })}
    </div>
  )
}

function NoConversationSelected() {
  return (
    <div className={style['message-list']}>
      <div className={style['no-conv']}>
        <h3>No conversations selected</h3>
        <p>
          Please select a conversation on the left pane to see a message history. If there are no conversations
          available, try talking to your bot and refresh conversations by clicking on the round arrow
        </p>
      </div>
    </div>
  )
}

export default class FullView extends React.Component {
  constructor(props) {
    super(props)

    const blob = new Blob([''], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)

    const defaultToDate = new Date(Date.now())
    defaultToDate.setHours(0, 0, 0, 0)

    this.state = {
      conversationsInfo: [],
      messageGroups: [],
      to: defaultToDate,
      from: this.offsetDateByDays(defaultToDate, -30),
      currentConvId: null,
      fileBlob: blob,
      fileURL: url
    }
  }

  threadIdParamName = 'threadId'

  offsetDateByDays(date, offset) {
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
    const ceiledToDate = this.offsetDateByDays(to, 1)

    this.props.bp.axios
      .get(`/mod/history/conversations/${from.getTime()}/${ceiledToDate.getTime()}`)
      .then(({ data }) => {
        this.setState({ conversationsInfo: data })
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
      const flattenMessages = data.flatMap(d => d)

      const content = JSON.stringify(flattenMessages)
      var blob = new Blob([content], { type: 'application/json' })
      var url = window.URL.createObjectURL(blob)

      const conversationsInfoCopy = [...this.state.conversationsInfo]
      const desiredConvInfo = conversationsInfoCopy.find(c => c.id === convId)
      if (desiredConvInfo) {
        desiredConvInfo.count = flattenMessages.length
      }

      this.setState({ messageGroups: data, fileBlob: blob, fileURL: url, conversationsInfo: conversationsInfoCopy })
    })
  }

  render() {
    if (!this.state.conversationsInfo) {
      return null
    }
    return (
      <div className={style['history-component']}>
        <ConversationPicker
          conversations={this.state.conversationsInfo}
          conversationChosenHandler={this.onConversationSelected.bind(this)}
          handleFromChange={day => {
            day.setHours(0, 0, 0, 0)
            this.setState({ from: day })
            this.getConversations(day, this.state.to)
          }}
          handleToChange={day => {
            day.setHours(0, 0, 0, 0)
            this.setState({ to: day })
            this.getConversations(this.state.from, day)
          }}
          defaultFrom={this.state.from}
          defaultTo={this.state.to}
          refresh={() => this.getConversations(this.state.from, this.state.to)}
        />
        <MessagesViewer
          convId={this.state.currentConvId}
          messageGroups={this.state.messageGroups}
          fileURL={this.state.fileURL}
        />
      </div>
    )
  }
}
