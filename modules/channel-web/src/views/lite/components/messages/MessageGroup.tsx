import * as sdk from 'botpress/sdk'
import classnames from 'classnames'
import { formatUrl } from 'common/url'
import { omit } from 'lodash'
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

  renderPayload(payload) {
    const type = payload?.type

    if (type === 'single-choice' && payload.choices) {
      return this.renderChoicePayload(payload)
    } else if (type === 'dropdown') {
      return this.renderDropdown(payload)
    } else if (type === 'image' && payload.image) {
      return this.renderImagePayload(payload)
    } else if (type === 'audio' && payload.audio) {
      return this.renderAudioPayload(payload)
    } else if (type === 'video' && payload.video) {
      return this.renderVideoPayload(payload)
    } else if (type === 'card') {
      return this.renderCarouselPayload({ ...payload, items: [payload] })
    } else if (type === 'carousel' && payload.items) {
      return this.renderCarouselPayload(payload)
    }

    return payload
  }

  renderChoicePayload(content: sdk.ChoiceContent) {
    if ((content as any).isDropdown) {
      return {
        type: 'custom',
        module: 'extensions',
        component: 'Dropdown',
        message: content.text,
        buttonText: '',
        displayInKeyboard: true,
        options: content.choices.map(c => ({ label: c.title, value: c.value.toUpperCase() })),
        width: 300,
        placeholderText: (content as any).dropdownPlaceholder
      }
    }
    return {
      type: 'custom',
      module: 'channel-web',
      component: 'QuickReplies',
      quick_replies: content.choices.map(c => ({
        title: c.title,
        payload: c.value.toUpperCase()
      })),
      disableFreeText: (content as any).disableFreeText,
      wrapped: {
        type: 'text',
        ...omit(content, 'choices', 'type')
      }
    }
  }

  renderDropdown(content: any) {
    // TODO: add typings for dropdowns
    return {
      type: 'custom',
      module: 'extensions',
      component: 'Dropdown',
      message: content.message,
      buttonText: content.buttonText,
      displayInKeyboard: content.displayInKeyboard,
      options: content.options,
      allowCreation: content.allowCreation,
      allowMultiple: content.allowMultiple,
      width: content.width,
      collectFeedback: content.collectFeedback,
      placeholderText: content.placeholderText,
      markdown: content.markdown
    }
  }

  renderImagePayload(content: sdk.ImageContent) {
    return {
      type: 'file',
      title: content.title,
      url: formatUrl('', content.image),
      collectFeedback: (content as any).collectFeedback
    }
  }

  renderAudioPayload(content: sdk.AudioContent) {
    return {
      type: 'audio',
      title: content.title,
      url: formatUrl('', content.audio),
      collectFeedback: (content as any).collectFeedback
    }
  }

  renderVideoPayload(content: sdk.VideoContent) {
    return {
      type: 'video',
      title: content.title,
      url: formatUrl('', content.video),
      collectFeedback: (content as any).collectFeedback
    }
  }

  renderCarouselPayload(content: sdk.CarouselContent) {
    return {
      text: ' ',
      type: 'carousel',
      collectFeedback: (content as any).collectFeedback,
      elements: content.items.map(card => ({
        title: card.title,
        picture: card.image ? formatUrl('', card.image) : null,
        subtitle: card.subtitle,
        buttons: (card.actions || []).map(a => {
          if (a.action === 'Say something') {
            return {
              type: 'say_something',
              title: a.title,
              text: (a as sdk.ActionSaySomething).text
            }
          } else if (a.action === 'Open URL') {
            return {
              type: 'open_url',
              title: a.title,
              url: (a as sdk.ActionOpenURL)?.url.replace('BOT_URL', '')
            }
          } else if (a.action === 'Postback') {
            return {
              type: 'postback',
              title: a.title,
              payload: (a as sdk.ActionPostback).payload
            }
          } else {
            throw new Error(`Webchat carousel does not support "${a.action}" action-buttons at the moment`)
          }
        })
      }))
    }
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
            {sortBy(messages, 'eventId').map((message, i, messages) => {
              const isLastMsg = i === messages.length - 1
              let payload = this.convertPayloadFromOldFormat(message)
              if (payload?.wrapped) {
                payload.wrapped = this.renderPayload(payload.wrapped)
              } else {
                payload = this.renderPayload(payload)
              }

              const showInlineFeedback =
                isBot && isLastMsg && (payload.wrapped ? payload.wrapped.collectFeedback : payload.collectFeedback)

              return (
                <Message
                  key={message.eventId}
                  isHighlighted={
                    this.props.highlightedMessages && this.props.highlightedMessages.includes(message.incomingEventId)
                  }
                  inlineFeedback={
                    showInlineFeedback && (
                      <InlineFeedback
                        intl={this.props.store.intl}
                        incomingEventId={message.incomingEventId}
                        onFeedback={this.props.onFeedback}
                        eventFeedbacks={this.props.store.eventFeedbacks}
                      />
                    )
                  }
                  noBubble={!!payload.noBubble}
                  fromLabel={fromLabel}
                  isLastOfGroup={i >= this.props.messages.length - 1}
                  isLastGroup={this.props.isLastGroup}
                  isBotMessage={!message.userId}
                  incomingEventId={message.incomingEventId}
                  payload={payload}
                  sentOn={message.sent_on}
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
