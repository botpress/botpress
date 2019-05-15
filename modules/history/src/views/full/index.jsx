import React from 'react'
import style from './style.scss'
import JSONTree from 'react-json-tree'
import 'react-day-picker/lib/style.css'
import DayPickerInput from 'react-day-picker/DayPickerInput'

import classnames from 'classnames'

import { TiRefresh } from 'react-icons/ti'

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
            <div
              className={style['conversations-text']}
              key={conv}
              value={conv}
              onClick={() => props.conversationChosenHandler(conv)}
            >
              {`conversation #${conv}`}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MessagesViewer(props) {
  return (
    <div className={style['message-viewer']}>
      <div className={style['message-list']}>
        {props.convId && <div className={style['message-title']}>Conversation #{props.convId}</div>}
        {props.convId && (
          <div className={style['message-lastdate']}>
            Last message on : #{getLastMessageDate(props.messages).toUTCString()}
          </div>
        )}
        {props.messages &&
          props.messages.map(m => {
            return (
              <div
                className={classnames(
                  style['message-elements'],
                  m.direction === 'outgoing' ? style['message-outgoing'] : style['message-incomming']
                )}
                key={`${m.id}: ${m.direction}`}
                value={m.id}
                onClick={() => props.messageChosenHandler(m)}
              >
                > {m.payload.text}
              </div>
            )
          })}
      </div>
      <div className={style['message-inspector']}>
        {props.currentlyFocusedMessage && (
          <JSONTree data={props.currentlyFocusedMessage} invertTheme={false} hideRoot={true} />
        )}
      </div>
    </div>
  )
}

const getLastMessageDate = messages => {
  return new Date(Math.max(...messages.map(m => new Date(m.createdOn))))
}

export default class FullView extends React.Component {
  constructor(props) {
    super(props)
  }

  state = {
    conversations: [],
    messages: [],
    currentlyFocusedMessage: null,
    to: new Date(Date.now()),
    from: this.offsetDate(Date.now(), -20),
    currentConvId: null
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

  componentWillUnmount() {
    this.unmounting = true
    clearInterval(this.metadataTimer)
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
      this.setState({ messages: data })
    })
  }

  focusMessage(message) {
    this.setState({ currentlyFocusedMessage: message })
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
        <MessagesViewer
          convId={this.state.currentConvId}
          messages={this.state.messages}
          messageChosenHandler={this.focusMessage.bind(this)}
          currentlyFocusedMessage={this.state.currentlyFocusedMessage}
        />
      </div>
    )
  }
}
