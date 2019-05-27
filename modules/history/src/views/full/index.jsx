import React from 'react'
import style from './style.scss'
import moment from 'moment'

import { MessageViewer } from './MessageViewer'
import { ConversationPicker } from './ConversationPicker'

const CONV_PARAM_NAME = 'conversation'

export default class FullView extends React.Component {
  state = {
    conversationsInfo: [],
    messageGroups: [],
    to: moment().startOf('day'),
    from: moment()
      .startOf('day')
      .subtract(30, 'days'),
    currentConversation: null,
    currentConversationMessageGroupsOffset: 0,
    currentConversationMessageGroupsCount: 0
  }

  componentDidMount() {
    this.getConversations(this.state.from, this.state.to)
    const url = new URL(window.location.href)
    const sessionId = url.searchParams.get(CONV_PARAM_NAME)
    if (sessionId) {
      this.getMessagesOfConversation(sessionId)
    }
  }

  getConversations = async (from, to) => {
    const ceiledToDate = moment(to).add(1, 'days')
    const apiURL = `/mod/history/conversations?from=${from.unix()}&to=${ceiledToDate.unix()}`
    const { data } = await this.props.bp.axios.get(apiURL)
    this.setState({ conversationsInfo: data })
  }

  selectConversation = async sessionId => {
    const url = new URL(window.location.href)
    url.searchParams.set(CONV_PARAM_NAME, sessionId)
    window.history.pushState(window.history.state, '', url.toString())

    await this.getMessagesOfConversation(sessionId)
  }

  hasConversationChanged(sessionId, currentConversation, receivedData) {
    return sessionId !== this.state.currentConversation || currentConversation.count !== receivedData.messageCount
  }

  getMessagesOfConversation = async sessionId => {
    const { data } = await this.props.bp.axios.get(`/mod/history/messages/${sessionId}`)

    const conversationsInfoCopy = [...this.state.conversationsInfo]
    const desiredConvInfo = conversationsInfoCopy.find(c => c.id === sessionId)

    if (!desiredConvInfo || !this.hasConversationChanged(sessionId, desiredConvInfo, data)) {
      return
    }

    desiredConvInfo.count = data.messageCount

    this.setState({
      currentConversation: sessionId,
      messageGroups: data.messageGroupsArray,
      conversationsInfo: conversationsInfoCopy,
      currentConversationMessageGroupsOffset: data.messageGroupsArray.length,
      currentConversationMessageGroupsCount: data.messageGroupCount
    })
  }

  handleFromChange(day) {
    const moment_day = moment(day).startOf('day')
    this.setState({ from: moment_day })
    this.getConversations(moment_day, this.state.to)
  }

  handleToChange(day) {
    const moment_day = moment(day).startOf('day')
    this.setState({ to: moment_day })
    this.getConversations(this.state.from, moment_day)
  }

  fetchMoreMessages = async () => {
    const { data } = await this.props.bp.axios.get(
      `/mod/history/more-messages/${this.state.currentConversation}?offset=${
        this.state.currentConversationMessageGroupsOffset
      }&clientCount=${this.state.currentConversationMessageGroupsCount}`
    )

    let messageGroupsCopy = [...this.state.messageGroups]
    messageGroupsCopy = messageGroupsCopy.concat(data)

    this.setState({
      messageGroups: messageGroupsCopy,
      currentConversationMessageGroupsOffset: messageGroupsCopy.length
    })
  }

  render() {
    if (!this.state.conversationsInfo) {
      return null
    }
    const isThereStillMessagesLeftToFetch =
      this.state.currentConversationMessageGroupsOffset !== this.state.currentConversationMessageGroupsCount
    return (
      <div className={style['history-component']}>
        <ConversationPicker
          conversations={this.state.conversationsInfo}
          onConversationChanged={sessionId => this.selectConversation(sessionId)}
          handleFromChange={day => this.handleFromChange(day)}
          handleToChange={day => this.handleToChange(day)}
          defaultFrom={this.state.from.toDate()}
          defaultTo={this.state.to.toDate()}
          refresh={() => this.getConversations(this.state.from, this.state.to)}
        />
        <MessageViewer
          isThereStillMessagesLeft={isThereStillMessagesLeftToFetch}
          fetchNewMessages={() => this.fetchMoreMessages()}
          conversation={this.state.currentConversation}
          messageGroups={this.state.messageGroups}
        />
      </div>
    )
  }
}
