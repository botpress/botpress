import classnames from 'classnames'
import _ from 'lodash'
import mimeTypes from 'mime/lite'
import moment from 'moment'
import path from 'path'
import React from 'react'
import ReactAudioPlayer from 'react-audio-player'

import { Message as HitlMessage } from '../../../../backend/typings'
import SVGIcon from '../SVGIcon'

const validMessageTypes = [
  'text',
  'message',
  'image',
  'video',
  'audio',
  'quick_reply',
  'custom',
  'visit',
  'file',
  'carousel'
]

const getComponent = (moduleName: string, componentName: string) =>
  window.botpress[moduleName] && window.botpress[moduleName][componentName]

export default class Message extends React.Component<{ message: HitlMessage }> {
  renderFile() {
    const { type, raw_message, text } = this.props.message

    const url = _.get(raw_message, 'url', text)
    const name = _.get(raw_message, 'name', '')

    const extension = path.extname(url)
    const mime = mimeTypes.getType(extension)

    if (type === 'image' || mime.includes('image/')) {
      return (
        <a href={url} target={'_blank'}>
          <img src={url} title={name} />
        </a>
      )
    } else if (type === 'audio' || mime.includes('audio/')) {
      return <ReactAudioPlayer src={this.props.message.text} />
    } else if (type === 'video' || mime.includes('video/')) {
      return (
        <video controls>
          <source src={this.props.message.text} type="video/mp4" />
        </video>
      )
    }

    return <p>Unsupported media</p>
  }

  renderText(text?: string) {
    const Text = getComponent('channel-web', 'Text')
    return Text ? <Text markdown={true} text={text || this.props.message.text} /> : <span>{text}</span>
  }

  renderDropdown() {
    const Dropdown = getComponent('channel-web', 'Dropdown')
    return Dropdown ? (
      <Dropdown isLastGroup={true} isLastOfGroup={true} options={this.props.message.raw_message.options} />
    ) : null
  }

  renderCarousel() {
    const Carousel = getComponent('channel-web', 'Carousel')
    return Carousel ? (
      <Carousel style={{ maxWidth: '400px' }} carousel={this.props.message.raw_message} />
    ) : (
      <span>Could not display carousel</span>
    )
  }

  renderQuickReply(quickReplies) {
    const Keyboard = getComponent('channel-web', 'Keyboard')
    const QuickReplies = getComponent('channel-web', 'QuickReplies')

    return Keyboard && QuickReplies ? (
      <span>
        <div style={{ paddingBottom: 10 }}>{this.renderText()}</div>
        <Keyboard.Default />
        <QuickReplies quick_replies={quickReplies} isLastGroup={true} isLastOfGroup={true} />
      </span>
    ) : (
      <span>Could not display quick replies</span>
    )
  }

  renderContent() {
    const { type, raw_message } = this.props.message

    if (type === 'message' || type === 'text' || type === 'quick_reply') {
      return this.renderText()
    } else if (type === 'image' || type === 'file' || type === 'video' || type === 'audio') {
      return this.renderFile()
    } else if (type === 'custom' && raw_message) {
      if (raw_message.component === 'Dropdown' && raw_message.options) {
        return this.renderDropdown()
      } else if (raw_message.component === 'QuickReplies' && raw_message.quick_replies) {
        return this.renderQuickReply(raw_message.quick_replies)
      }

      return (
        <span>
          Bot sent custom component: [Module: {raw_message.module}, Component: {raw_message.component}]
        </span>
      )
    } else if (type === 'carousel') {
      return this.renderCarousel()
    }

    return <span>Cannot display this message</span>
  }

  renderMessage() {
    const { ts, direction, type, source } = this.props.message
    const date = moment(ts).format('MMMM Do YYYY, h:mm a')

    let messageFrom = 'bot'
    if (direction === 'in') {
      if (type === 'visit') {
        return (
          <div className={classnames('bph-message', 'bph-from-system')}>
            <p>User visit: {date}</p>
          </div>
        )
      }
      messageFrom = 'user'
    } else if (source === 'agent') {
      messageFrom = 'agent'
    }

    const avatar = (
      <div className="bph-message-avatar">
        {<SVGIcon name={messageFrom} width="50" fill="#FFF" />}
        <time>{moment(ts).format('LT')}</time>
      </div>
    )

    return (
      <div
        className={classnames('bph-message', {
          ['bph-from-agent']: messageFrom === 'agent',
          ['bph-from-bot']: messageFrom === 'bot'
        })}
      >
        {messageFrom === 'user' && avatar}
        <div className="bph-message-container">
          <div className="bph-chat-bubble">{this.renderContent()}</div>
        </div>
        {messageFrom !== 'user' && avatar}
      </div>
    )
  }

  render() {
    if (!validMessageTypes.includes(this.props.message.type)) {
      return null
    }

    return this.renderMessage()
  }
}
