import * as sdk from 'botpress/sdk'
import { formatUrl } from 'common/url'
import _ from 'lodash'
import React, { FC, useEffect } from 'react'

import { FlaggedMessageGroup } from '../../../../backend/typings'
import style from '../../style.scss'

import Message from './Message'

export const MessageList: FC<{ messageGroups: FlaggedMessageGroup[] }> = props => {
  const { messageGroups } = props
  const itemRefs = {}

  useEffect(() => {
    if (_.isEmpty(messageGroups)) {
      return
    }
    const flaggedMessageGroup = messageGroups.find(g => g.flagged)
    const ref = itemRefs[flaggedMessageGroup.incoming.id]
    messagesListRef.current.scrollTop =
      ref.offsetTop - screen.height / 2 + ref.offsetHeight / 2 + messagesListRef.current.offsetTop
  })

  const messagesListRef = React.createRef<HTMLDivElement>()

  return (
    <div ref={messagesListRef} className={style.conversationMessages}>
      {messageGroups.map(group => (
        <div
          ref={el => (itemRefs[group.incoming.id] = el)}
          key={group.incoming.id}
          className={`${style.messageGroup} ` + (group.flagged && style.flagged)}
        >
          <Message message={{ ...group.incoming, raw_message: renderPayload(group.incoming.raw_message) }} />
          {group.replies.map(message => (
            <Message
              key={`${group.incoming.id}-${message.id}`}
              message={{ ...message, raw_message: renderPayload(message.raw_message) }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

const renderPayload = payload => {
  const type = payload?.type

  if (type === 'single-choice' && payload.choices) {
    return renderChoicePayload(payload)
  } else if (type === 'dropdown') {
    return renderDropdownPayload(payload)
  } else if (type === 'image' && payload.image) {
    return renderImagePayload(payload)
  } else if (type === 'audio' && payload.audio) {
    return renderAudioPayload(payload)
  } else if (type === 'video' && payload.video) {
    return renderVideoPayload(payload)
  } else if (type === 'card') {
    return renderCarouselPayload({ ...payload, items: [payload] })
  } else if (type === 'carousel' && payload.items) {
    return renderCarouselPayload(payload)
  }

  return payload
}

const renderChoicePayload = (content: sdk.ChoiceContent) => {
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

const renderDropdownPayload = (content: any) => {
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

const renderImagePayload = (content: sdk.ImageContent) => {
  return {
    type: 'file',
    title: content.title,
    url: formatUrl('', content.image),
    collectFeedback: (content as any).collectFeedback
  }
}

const renderAudioPayload = (content: sdk.AudioContent) => {
  return {
    type: 'audio',
    title: content.title,
    url: formatUrl('', content.audio),
    collectFeedback: (content as any).collectFeedback
  }
}

const renderVideoPayload = (content: sdk.VideoContent) => {
  return {
    type: 'video',
    title: content.title,
    url: formatUrl('', content.video),
    collectFeedback: (content as any).collectFeedback
  }
}

const renderCarouselPayload = (content: sdk.CarouselContent) => {
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
