import sdk from 'botpress/sdk'
import classnames from 'classnames'
import omit from 'lodash/omit'
import { inject } from 'mobx-react'
import React, { Fragment } from 'react'

import { RootStore, StoreDef } from '../../store'
import { Message as MessageDetails } from '../../typings'

import { InlineFeedback } from './InlineFeedback'
import Message from './Message'

export const getSuggestionPayload = (suggestions: sdk.IO.SuggestChoice[]) => {
  if (!suggestions?.length) {
    return null
  }
  const position = suggestions[0].position ?? 'static'

  if (suggestions.length <= 4) {
    return {
      type: 'custom',
      module: 'channel-web',
      component: 'QuickReplies',
      quick_replies: suggestions,
      position
    }
  }

  return {
    type: 'custom',
    module: 'extensions',
    component: 'Dropdown',
    options: suggestions,
    position
  }
}

class MessageGroup extends React.Component<Props> {
  state = {
    hasError: false
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  /**
   * @deprecated 12.0
   * Here, we convert old format to the new format Botpress uses internally.
   * - payload: all the data (raw, whatever) that is necessary to display the element
   * - type: extracted from payload for easy sorting
   */
  convertPayloadFromOldFormat = data => {
    let payload = data.payload || data.message_data || data.message_raw || { text: data.message_text }
    if (!payload.type) {
      payload.type = data.message_type || data.message_data?.type || 'text'
    }

    // Keeping compatibility with old schema for the quick reply
    if (data.message_type === 'quick_reply' && !payload.text) {
      payload.text = data.message_text
    }

    if (data.message_type === 'file' && !payload.url) {
      payload.url = data.message_data?.url || data.message_raw?.url
    }

    if (this.props.messageWrapper && payload.type !== 'session_reset') {
      payload = {
        type: 'custom',
        module: this.props.messageWrapper.module,
        component: this.props.messageWrapper.component,
        wrapped: payload
      }
    }

    return payload
  }

  render() {
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
          'bpw-from-user': !this.props.isBot,
          'bpw-from-bot': this.props.isBot
        })}
      >
        {this.props.avatar}
        <div role="region" className={'bpw-message-container'}>
          {this.props.showUserName && <div className={'bpw-message-username'}>{this.props.userName}</div>}
          <div aria-live="assertive" role="log" className={'bpw-message-group'}>
            <span data-from={fromLabel} className="from hidden" aria-hidden="true">
              {fromLabel}
            </span>
            {this.props.messages.map((data, i) => {
              const isLastMsg = i == this.props.messages.length - 1
              const payload = this.convertPayloadFromOldFormat(data)

              const showInlineFeedback =
                this.props.isBot &&
                isLastMsg &&
                (payload.wrapped ? payload.wrapped.collectFeedback : payload.collectFeedback)

              const commonProps = {
                isHighlighted:
                  this.props.highlightedMessages && this.props.highlightedMessages.includes(data.incomingEventId),
                sentOn: data.sent_on,
                onSendData: this.props.onSendData,
                onFileUpload: this.props.onFileUpload,
                bp: this.props.bp,
                store: this.props.store,
                fromLabel: fromLabel,
                isLastOfGroup: i >= this.props.messages.length - 1,
                isLastGroup: this.props.isLastGroup,
                isBotMessage: !data.userId,
                incomingEventId: data.incomingEventId
              }

              const suggestions = this.props.suggestions.filter(
                x => x.eventId === data.incomingEventId && x.position === 'conversation'
              )

              return (
                <Fragment key={`msg-${i}`}>
                  <Message
                    {...commonProps}
                    payload={payload}
                    inlineFeedback={
                      showInlineFeedback && (
                        <InlineFeedback
                          intl={this.props.store.intl}
                          incomingEventId={data.incomingEventId}
                          onFeedback={this.props.onFeedback}
                          eventFeedbacks={this.props.store.eventFeedbacks}
                        />
                      )
                    }
                  />
                  {!!suggestions.length && this.props.isBot && commonProps.isLastOfGroup && (
                    <Message
                      {...commonProps}
                      key={`msg-${i}-suggest`}
                      payload={getSuggestionPayload(suggestions)}
                      position="conversation"
                      noBubble
                    />
                  )}
                </Fragment>
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
  suggestions: sdk.IO.SuggestChoice[]
  isLastGroup: boolean
  onFileUpload?: any
  onSendData?: any
  onFeedback?: any
  store?: RootStore
  highlightedMessages?: string[]
} & Pick<StoreDef, 'showUserName' | 'messageWrapper' | 'bp'>
