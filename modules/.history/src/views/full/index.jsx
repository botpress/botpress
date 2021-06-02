import React from 'react'
import moment from 'moment'
import { ModuleUI } from 'botpress/shared'

import { MessageViewer } from './MessageViewer'
import { ConversationPicker } from './ConversationPicker'

const { Container, SidePanel } = ModuleUI
const CONV_PARAM_NAME = 'conversation'

export default class FullView extends React.Component {
  state = {
    conversationsInfo: [],
    messageGroups: [],
    to: undefined,
    from: undefined,
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

  handleDateChange = dateRange => {
    const [from, to] = dateRange.map(date => (date ? moment(date) : undefined))
    this.setState({ from, to })
    this.getConversations(from, to)
  }

  getConversations = async (from, to) => {
    const ceiledToDate = moment(to).add(1, 'days')
    const apiURL = `/mod/history/conversations`

    const bothAreDefined = !!from && !!to
    const params = bothAreDefined ? { from: from.unix(), to: ceiledToDate.unix() } : undefined

    const { data } = await this.props.bp.axios.get(apiURL, { params })

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
    const resourceUrl = `/mod/history/messages/${sessionId}`
    const flag = filters && filters.flag
    const { data } = await this.props.bp.axios.get(resourceUrl, { params: { flag } })

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

  fetchMoreMessages = async filters => {
    const resourceUrl = `/mod/history/more-messages/${this.state.currentConversation}`
    const offset = this.state.currentConversationMessageGroupsOffset
    const clientCount = this.state.currentConversationMessageGroupsCount
    const flag = filters && filters.flag
    const { data } = await this.props.bp.axios.get(resourceUrl, { params: { offset, clientCount, flag } })

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
      <Container>
        <SidePanel>
          <ConversationPicker
            conversations={this.state.conversationsInfo}
            onConversationChanged={this.selectConversation}
            handleDateChange={this.handleDateChange}
            from={this.state.from && this.state.from.toDate()}
            to={this.state.to && this.state.to.toDate()}
            refresh={() => this.getConversations(this.state.from, this.state.to)}
          />
        </SidePanel>
        <MessageViewer
          isThereStillMessagesLeft={isThereStillMessagesLeftToFetch}
          fetchNewMessages={this.fetchMoreMessages}
          conversation={this.state.currentConversation}
          messageGroups={this.state.messageGroups}
          flagMessages={this.flagMessages}
          unflagMessages={this.unflagMessages}
          updateConversationWithFilters={f => this.getMessagesOfConversation(this.state.currentConversation, f)}
        />
      </Container>
    )
  }
}
