import * as sdk from 'botpress/sdk'
import { formatUrl } from 'common/url'
import _ from 'lodash'
import moment from 'moment'
import React, { FC } from 'react'

import { Message as HitlMessage } from '../../../../backend/typings'

import Message from './Message'

interface Props {
  messages: HitlMessage[]
}

class MessageWrapper extends React.Component<{ message: any }> {
  state = {
    hasError: false
  }

  static getDerivedStateFromError(error) {
    console.error('There was an error while trying to display this message: ', error)
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <p className="bph-chat-error">* Cannot display message *</p>
    }

    return (
      <Message message={{ ...this.props.message, raw_message: this.renderPayload(this.props.message.raw_message) }} />
    )
  }

  renderPayload(payload) {
    const type = payload?.type

    if (type === 'single-choice' && payload.choices) {
      return this.renderChoicePayload(payload)
    } else if (type === 'dropdown') {
      return this.renderDropdownPayload(payload)
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
        ..._.omit(content, 'choices', 'type')
      }
    }
  }

  renderDropdownPayload(content: any) {
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
}

export const MessageList: FC<Props> = props => {
  if (!props.messages) {
    return <div>No Messages found</div>
  }

  const groupedMessages = _.groupBy(props.messages, msg => moment(msg.ts).format('YYYY-MM-DD'))
  const groups = Object.keys(groupedMessages).map(x => groupedMessages[x])

  if (!groups) {
    return null
  }

  return (
    <div>
      {groups.map(group => (
        <div key={group[0].id}>
          <div className="bph-conversation-date">
            <span>{moment(group[0].ts).format('DD MMMM YYYY')}</span>
          </div>
          {group.map(message => (
            <MessageWrapper key={`${message.id}${message.ts}`} message={message} />
          ))}
        </div>
      ))}
    </div>
  )
}
