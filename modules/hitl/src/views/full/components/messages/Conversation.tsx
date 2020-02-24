import _ from 'lodash'
import React from 'react'

import { HitlSessionOverview, Message as HitlMessage } from '../../../../backend/typings'
import { HitlApi } from '../../api'

import { ConversationHeader } from './ConversationHeader'
import { MessageList } from './MessageList'

interface Props {
  events: any
  currentSession: HitlSessionOverview
  api: HitlApi
  currentSessionId: string
}

export default class Conversation extends React.Component<Props> {
  private messagesDiv: HTMLElement

  state = {
    loading: true,
    messages: null
  }

  componentDidMount() {
    this.tryScrollToBottom(true)
    this.props.events.on('hitl.message', this.appendMessage)
  }

  componentWillUnmount() {
    this.props.events.off('hitl.message', this.appendMessage)
  }

  async componentDidUpdate(prevProps) {
    this.tryScrollToBottom()
    if (prevProps.currentSessionId !== this.props.currentSessionId) {
      await this.fetchSessionMessages(this.props.currentSessionId)
    }
  }

  async fetchSessionMessages(sessionId) {
    this.setState({ loading: true })

    const messages = await this.props.api.fetchSessionMessages(sessionId)
    this.setState({ loading: false, messages })

    this.tryScrollToBottom()
  }

  appendMessage = (message: HitlMessage) => {
    if (!this.state.messages || message.session_id !== this.props.currentSessionId) {
      return
    }

    this.setState({ messages: [...this.state.messages, message] })
    this.tryScrollToBottom()
  }

  tryScrollToBottom(delayed?: boolean) {
    setTimeout(
      () => {
        try {
          this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight
        } catch (err) {
          // Discard the error
        }
      },
      delayed ? 200 : 0
    )
  }

  render() {
    if (!this.props.currentSession) {
      return null
    }

    const { user, id, isPaused } = this.props.currentSession
    const displayName = _.get(user, 'attributes.full_name', user.fullName)

    return (
      <div className="bph-conversation" style={{ overflow: 'hidden' }}>
        <ConversationHeader api={this.props.api} displayName={displayName} isPaused={!!isPaused} sessionId={id} />

        <div className="bph-conversation-messages" ref={m => (this.messagesDiv = m)}>
          <MessageList messages={this.state.messages} />
        </div>
      </div>
    )
  }
}
