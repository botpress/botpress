import React from 'react'
import style from './style.scss'

import { MessagesViewer } from './message'
import { ConversationPicker } from './conversation'

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
