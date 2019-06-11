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

  getMessagesOfConversation = async (sessionId, filters) => {
    const ressourceUrl = `/mod/history/messages/${sessionId}`
    const flag = filters && filters.flag
    const { data } = await this.props.bp.axios.get(ressourceUrl, { params: { flag } })

    const conversationsInfoCopy = [...this.state.conversationsInfo]
    const desiredConvInfo = conversationsInfoCopy.find(c => c.id === sessionId)

    const updateConv = filters || (desiredConvInfo && this.hasConversationChanged(sessionId, desiredConvInfo, data))
    if (!updateConv) {
      return
    }

    desiredConvInfo.count = data.messageCount

    this.setState({
      currentConversation: sessionId,
      messageGroups: data.messageGroups,
      conversationsInfo: conversationsInfoCopy,
      currentConversationMessageGroupsOffset: data.messageGroups.length,
      currentConversationMessageGroupsCount: data.messageGroupCount
    })
  }

  handleFromChange = day => {
    const moment_day = moment(day).startOf('day')
    this.setState({ from: moment_day })
    this.getConversations(moment_day, this.state.to)
  }

  handleToChange = day => {
    const moment_day = moment(day).startOf('day')
    this.setState({ to: moment_day })
    this.getConversations(this.state.from, moment_day)
  }

  fetchMoreMessages = async filters => {
    const ressourceUrl = `/mod/history/more-messages/${this.state.currentConversation}`
    const offset = this.state.currentConversationMessageGroupsOffset
    const clientCount = this.state.currentConversationMessageGroupsCount
    const flag = filters && filters.flag
    const { data } = await this.props.bp.axios.get(ressourceUrl, { params: { offset, clientCount, flag } })

    let messageGroupsCopy = [...this.state.messageGroups]
    messageGroupsCopy = messageGroupsCopy.concat(data)

    this.setState({
      messageGroups: messageGroupsCopy,
      currentConversationMessageGroupsOffset: messageGroupsCopy.length
    })
  }

  flagMessages = async messages => {
    const messageGroupCpy = [...this.state.messageGroups]
    _.forEach(messageGroupCpy, mg => {
      mg.isFlagged = mg.isFlagged || messages.includes(mg)
    })
    this.setState({ messageGroups: messageGroupCpy })
    await this.props.bp.axios.post('/mod/history/flagged-messages', messages)
  }

  unflagMessages = async messages => {
    const messageGroupCpy = [...this.state.messageGroups]
    _.forEach(messageGroupCpy, mg => {
      mg.isFlagged = mg.isFlagged && !messages.includes(mg)
    })
    this.setState({ messageGroups: messageGroupCpy })
    await this.props.bp.axios.delete('/mod/history/flagged-messages', { data: messages })
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
          onConversationChanged={this.selectConversation}
          handleFromChange={this.handleFromChange}
          handleToChange={this.handleToChange}
          defaultFrom={this.state.from.toDate()}
          defaultTo={this.state.to.toDate()}
          refresh={() => this.getConversations(this.state.from, this.state.to)}
        />
        <MessageViewer
          isThereStillMessagesLeft={isThereStillMessagesLeftToFetch}
          fetchNewMessages={this.fetchMoreMessages}
          conversation={this.state.currentConversation}
          messageGroups={this.state.messageGroups}
          flagMessages={this.flagMessages}
          unflagMessages={this.unflagMessages}
          updateConversationWithFilters={f => this.getMessagesOfConversation(this.state.currentConversation, f)}
        />
      </div>
    )
  }
}
