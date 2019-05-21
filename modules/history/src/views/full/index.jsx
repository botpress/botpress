import React from 'react'
import style from './style.scss'
import moment from 'moment'

import { MessagesViewer } from './MessageViewer'
import { ConversationPicker } from './ConversationPicker'

const CONV_HASH_PARAM_NAME = 'convHash'

export default class FullView extends React.Component {
  state = {
    conversationsInfo: [],
    messageGroups: [],
    to: moment().startOf('day'),
    from: moment()
      .startOf('day')
      .subtract(30, 'days'),
    currentConvHash: null
  }

  componentDidMount() {
    this.getConversations(this.state.from, this.state.to)
    const url = new URL(window.location.href)
    const convHash = url.searchParams.get(CONV_HASH_PARAM_NAME)
    if (convHash) {
      this.setState({ currentConvHash: convHash })
      this.getMessagesOfConversation(convHash)
    }
  }

  getConversations = async (from, to) => {
    const ceiledToDate = moment(to).add(1, 'days')
    const apiURL = `/mod/history/conversations?from=${from.unix()}&to=${ceiledToDate.unix()}`
    const { data } = await this.props.bp.axios.get(apiURL)
    this.setState({ conversationsInfo: data })
  }

  selectConversation = async convHash => {
    const url = new URL(window.location.href)
    url.searchParams.set(CONV_HASH_PARAM_NAME, convHash)
    window.history.pushState(window.history.state, '', url.toString())

    await this.getMessagesOfConversation(convHash)
  }

  getMessagesOfConversation = async convHash => {
    const { data } = await this.props.bp.axios.get(`/mod/history/messages/${convHash}`)

    const conversationsInfoCopy = [...this.state.conversationsInfo]
    const desiredConvInfo = conversationsInfoCopy.find(c => c.id === convHash)
    if (desiredConvInfo) {
      desiredConvInfo.count = data.flatMap(d => d).length
    }

    this.setState({
      currentConvHash: convHash,
      messageGroups: data,
      conversationsInfo: this.state.conversationsInfo
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

  render() {
    if (!this.state.conversationsInfo) {
      return null
    }
    return (
      <div className={style['history-component']}>
        <ConversationPicker
          conversations={this.state.conversationsInfo}
          onConversationChanged={day => this.selectConversation(day)}
          handleFromChange={day => this.handleFromChange(day)}
          handleToChange={day => this.handleToChange(day)}
          defaultFrom={this.state.from.toDate()}
          defaultTo={this.state.to.toDate()}
          refresh={() => this.getConversations(this.state.from, this.state.to)}
        />
        <MessagesViewer convHash={this.state.currentConvHash} messageGroups={this.state.messageGroups} />
      </div>
    )
  }
}
