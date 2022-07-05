import classnames from 'classnames'
import sortBy from 'lodash/sortBy'
import { inject } from 'mobx-react'
import React from 'react'

import { RootStore, StoreDef } from '../../store'
import { Message as MessageDetails } from '../../typings'

import { InlineFeedback } from './InlineFeedback'
import Message from './Message'

class MessageGroup extends React.Component<Props> {
  state = {
    hasError: false,
    audioPlayingIndex: 0
  }

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true }
  }

  onAudioEnded = () => {
    if (this.state.audioPlayingIndex >= this.props.messages.length - 1) {
      this.state.audioPlayingIndex = -1
    } else {
      this.setState({ ...this.state, audioPlayingIndex: this.state.audioPlayingIndex += 1 })
    }
  }

  render() {
    const { messages, avatar, isBot, showUserName, userName } = this.props

    const fromLabel = this.props.store.intl.formatMessage({
      id: this.props.isBot ? 'message.fromBotLabel' : 'message.fromMeLabel',
      defaultMessage: 'Me'
    })

    if (this.state.hasError) {
      return '* Cannot display message *'
    }

    return (
      <div
        role="main"
        className={classnames('bpw-message-big-container', {
          'bpw-from-user': !isBot,
          'bpw-from-bot': isBot
        })}
      >
        {avatar}
        <div role="region" className={'bpw-message-container'}>
          {showUserName && <div className={'bpw-message-username'}>{userName}</div>}
          <div aria-live="assertive" role="log" className={'bpw-message-group'}>
            <span data-from={fromLabel} className="from hidden" aria-hidden="true">
              {fromLabel}
            </span>
            {sortBy(messages, ['sentOn', 'eventId']).map((message, i, messages) => {
              console.log('message', message)
              const isLastMsg = i === messages.length - 1
              const payload = message.payload

              const showInlineFeedback = isBot && isLastMsg && payload.collectFeedback
              return (
                <Message
                  key={`${message.id}-${message.payload.type}`}
                  inlineFeedback={
                    showInlineFeedback && (
                      <InlineFeedback
                        intl={this.props.store.intl}
                        messageId={message.id}
                        onFeedback={this.props.onFeedback}
                        messageFeedbacks={this.props.store.messageFeedbacks}
                      />
                    )
                  }
                  messageId={message.id}
                  noBubble={!!payload.noBubble}
                  fromLabel={fromLabel}
                  isLastOfGroup={i >= messages.length - 1}
                  isLastGroup={this.props.isLastGroup}
                  isBotMessage={!message.authorId}
                  payload={payload}
                  sentOn={message.sentOn}
                  onSendData={this.props.onSendData}
                  onFileUpload={this.props.onFileUpload}
                  bp={this.props.bp}
                  store={this.props.store}
                  onAudioEnded={this.onAudioEnded}
                  shouldPlay={this.state.audioPlayingIndex === i}
                />
              )
            })}
          </div>
        </div>
      </div>
    )
  }
}

export default inject(({ store }: { store: RootStore }) => ({
  store,
  bp: store.bp,
  onFeedback: store.sendFeedback,
  onSendData: store.sendData,
  onFileUpload: store.uploadFile,
  messageWrapper: store.messageWrapper,
  showUserName: store.config.showUserName,
  highlightedMessages: store.view.highlightedMessages
}))(MessageGroup)

type Props = {
  isBot: boolean
  avatar: JSX.Element
  userName: string
  messages: MessageDetails[]
  isLastGroup: boolean
  onFileUpload?: any
  onSendData?: any
  onFeedback?: any
  store?: RootStore
  highlightedMessages?: string[]
} & Pick<StoreDef, 'showUserName' | 'messageWrapper' | 'bp'>
