import React from 'react'
import style from './style.scss'
import JSONTree from 'react-json-tree'
import 'react-day-picker/lib/style.css'
import DayPickerInput from 'react-day-picker/DayPickerInput'

import { TiRefresh } from 'react-icons/ti'

function QueryOptions(props) {
  return (
    <div className={style['query-options']}>
      <div>
        <div>from:</div>
        <DayPickerInput selectedDays={[new Date(Date.now())]} onDayChange={props.handleFromChange} />
      </div>
      <div>
        <div>to:</div>
        <DayPickerInput onDayChange={props.handleToChange} />
      </div>
      <TiRefresh size={70} onClick={props.refresh} />
    </div>
  )
}

function ConversationPicker(props) {
  return (
    <div className={style['conversations']}>
      <QueryOptions
        handleFromChange={props.handleFromChange}
        handleToChange={props.handleToChange}
        refresh={props.refresh}
      />
      <div>
        {props.conversations.map(conv => {
          return (
            <div key={conv} value={conv} onClick={() => props.conversationChosenHandler(conv)}>
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
        {props.messages &&
          props.messages.map(m => {
            return (
              <div
                className={m.direction === 'outgoing' ? style['outgoing'] : style['incomming']}
                value={m.id}
                onClick={() => props.messageChosenHandler(m)}
              >
                > {m.payload.text}
              </div>
            )
          })}
      </div>
      {props.currentlyFocusedMessage && (
        <div className={style['message-inspector']}>
          <JSONTree data={props.currentlyFocusedMessage} invertTheme={false} hideRoot={true} />
        </div>
      )}
    </div>
  )
}

export default class FullView extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      conversations: [],
      messages: [],
      currentlyFocusedMessage: null,
      to: new Date(Date.now),
      from: this.offsetDate(Date.now, -20)
    }
  }

  offsetDate(date, offset) {
    const newDate = new Date(date)
    newDate.setDate(newDate.getDate() + offset)
    return newDate
  }

  componentDidMount() {
    this.getConversations()
  }

  componentWillUnmount() {
    this.unmounting = true
    clearInterval(this.metadataTimer)
  }

  getConversations() {
    const ceiledToDate = this.offsetDate(this.state.to, 1)

    this.props.bp.axios
      .get(`/mod/history/conversations/${this.state.from.getTime()}/${ceiledToDate.getTime()}`)
      .then(({ data }) => {
        this.setState({ conversations: data })
      })
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
      <div className={style['msg-container']}>
        <ConversationPicker
          conversations={this.state.conversations}
          conversationChosenHandler={this.getMessagesOfConversation.bind(this)}
          handleFromChange={day => {
            this.state.from = day
          }}
          handleToChange={day => {
            this.state.to = day
          }}
          refresh={this.getConversations.bind(this)}
        />
        <MessagesViewer
          messages={this.state.messages}
          messageChosenHandler={this.focusMessage.bind(this)}
          currentlyFocusedMessage={this.state.currentlyFocusedMessage}
        />
      </div>
    )
  }
}
