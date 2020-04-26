import { lang } from 'botpress/shared'
import classnames from 'classnames'
import _ from 'lodash'
import mimeTypes from 'mime/lite'
import moment from 'moment'
import path from 'path'
import React from 'react'

import { Message } from '../../../../backend/typings'
import style from '../../style.scss'
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

export default (props: { message: Message }) => {
  const renderFile = () => {
    const { type, raw_message, text } = props.message

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
    } else if (type === 'video' || mime.includes('video/')) {
      return (
        <video controls>
          <source src={props.message.text} type="video/mp4" />
        </video>
      )
    }

    return <p>{lang.tr('module.bot-improvement.unsupported')}</p>
  }

  const renderText = (text?: string) => {
    const Text = getComponent('channel-web', 'Text')
    return Text ? <Text markdown={true} text={text || props.message.text} /> : <span>{text}</span>
  }

  const renderDropdown = () => {
    const Dropdown = getComponent('extensions', 'Dropdown')
    return Dropdown ? (
      <Dropdown isLastGroup={true} isLastOfGroup={true} options={props.message.raw_message.options} />
    ) : null
  }

  const renderCarousel = () => {
    const Carousel = getComponent('channel-web', 'Carousel')
    return Carousel ? (
      <Carousel carousel={props.message.raw_message} />
    ) : (
      <span>{lang.tr('module.bot-improvement.cantDisplayCarousel')}</span>
    )
  }

  const renderQuickReply = quickReplies => {
    const Keyboard = getComponent('channel-web', 'Keyboard')
    const QuickReplies = getComponent('channel-web', 'QuickReplies')

    return Keyboard && QuickReplies ? (
      <span>
        <div style={{ paddingBottom: 10 }}>{renderText()}</div>
        <Keyboard.Default />
        <QuickReplies quick_replies={quickReplies} isLastGroup={true} isLastOfGroup={true} />
      </span>
    ) : (
      <span>{lang.tr('module.bot-improvement.cantDisplayQuickReplies')}</span>
    )
  }

  const renderContent = () => {
    const { type, raw_message } = props.message

    if (type === 'message' || type === 'text' || type === 'quick_reply') {
      return renderText()
    } else if (type === 'image' || type === 'file' || type === 'video' || type === 'audio') {
      return renderFile()
    } else if (type === 'custom' && raw_message) {
      if (raw_message.component === 'Dropdown' && raw_message.options) {
        return renderDropdown()
      } else if (raw_message.component === 'QuickReplies' && raw_message.quick_replies) {
        return renderQuickReply(raw_message.quick_replies)
      }

      return (
        <span>
          {lang.tr('module.bot-improvement.botSentCustom')}: [{lang.tr('module.bot-improvement.module')}:{' '}
          {raw_message.module}, {lang.tr('module.bot-improvement.component')}: {raw_message.component}]
        </span>
      )
    } else if (type === 'carousel') {
      return renderCarousel()
    }

    return <span>{lang.tr('module.bot-improvement.cantDisplayMessage')}</span>
  }

  const renderMessage = () => {
    const { ts, direction, type } = props.message
    const date = moment(ts).format('MMMM Do YYYY, h:mm a')

    let messageFrom = 'bot'
    if (direction === 'in') {
      if (type === 'visit') {
        return (
          <div className={classnames(style.message, style.fromSystem)}>
            <p>
              {lang.tr('module.bot-improvement.userVisit')}: {date}
            </p>
          </div>
        )
      }
      messageFrom = 'user'
    }

    const avatar = (
      <div className={style.messageAvatar}>
        {<SVGIcon name={messageFrom} width="50" fill="#FFF" />}
        <time>{moment(ts).format('L LTS')}</time>
      </div>
    )

    return (
      <div
        className={classnames(style.message, {
          [style.fromBot]: messageFrom === 'bot'
        })}
      >
        {messageFrom === 'user' && avatar}
        <div className={style.messageContainer}>
          <div className={style.chatBubble}>{renderContent()}</div>
        </div>
        {messageFrom !== 'user' && avatar}
      </div>
    )
  }

  if (!validMessageTypes.includes(props.message.type)) {
    return null
  }

  return renderMessage()
}
