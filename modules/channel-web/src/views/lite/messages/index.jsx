import React, { Component } from 'react'
import classnames from 'classnames'

import format from 'date-fns/format'
import differenceInMinutes from 'date-fns/difference_in_minutes'
import Linkify from 'react-linkify'
import snarkdown from 'snarkdown'

import Avatar from '../avatar'
import QuickReplies from './quick_replies'
import LoginPrompt from './login_prompt'
import FileMessage from './file'
import CarouselMessage from './carousel'

import style from './style.scss'
import Form from './form'

const TIME_BETWEEN_DATES = 10 // 10 minutes

class MessageGroup extends Component {
  render() {
    const className = classnames('bp-msg-group', style.message, {
      [style.user]: !this.props.isBot,
      'bp-from-user': !this.props.isBot,
      'bp-from-bot': this.props.isBot
    })
    const bubbleColor = this.props.fgColor
    const textColor = this.props.textColor

    return (
      <div className={className}>
        {this.props.avatar}
        <div className={'bp-msg-container ' + style['message-container']}>
          {this.props.showUserName && (
            <div className={'bp-msg-username ' + style['info-line']}>{this.props.userName}</div>
          )}
          <div className={'bp-msg-group ' + style.group}>
            {this.props.messages.map((data, i) => {
              return (
                <Message
                  bp={this.props.bp}
                  onLoginPromptSend={this.props.onLoginPromptSend}
                  textColor={textColor}
                  bubbleColor={bubbleColor}
                  key={`msg-${i}`}
                  isLastOfGroup={i >= this.props.messages.length - 1}
                  isLastGroup={this.props.isLastGroup}
                  data={data}
                  onSendData={this.props.onSendData}
                />
              )
            })}
          </div>
        </div>
      </div>
    )
  }
}

export default class MessageList extends Component {
  componentDidMount() {
    this.tryScrollToBottom()
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.focused && this.props.focused) {
      this.messagesDiv.focus()
    }

    //new message to display
    if (prevProps.messages !== this.props.messages || this.props.typingUntil) {
      this.tryScrollToBottom()
    }
  }

  tryScrollToBottom() {
    try {
      this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight
    } catch (err) {
      // Discard the error
    }
  }

  handleKeyDown = e => {
    if (!this.props.enableArrowNavigation) {
      return
    }

    const maxScroll = this.messagesDiv.scrollHeight - this.messagesDiv.clientHeight
    const shouldFocusNext = e.key == 'ArrowRight' || (e.key == 'ArrowDown' && this.messagesDiv.scrollTop == maxScroll)
    const shouldFocusPrevious = e.key == 'ArrowLeft' || (e.key == 'ArrowUp' && this.messagesDiv.scrollTop == 0)

    if (shouldFocusNext) {
      this.messagesDiv.blur()
      this.props.focusNext()
    }

    if (shouldFocusPrevious) {
      this.messagesDiv.blur()
      this.props.focusPrevious()
    }
  }

  renderQuickReplies() {
    const messages = this.props.messages || []
    const message = messages[messages.length - 1]
    const quick_replies = message && message['message_raw'] && message['message_raw']['quick_replies']
    const currentText = this.props.currentText
    const filterQuickReplies = this.props.filterQuickReplies

    const filteredQuickReplies = quick_replies
      ? quick_replies.filter(quick_reply => {
          const regExp = new RegExp(currentText, 'i')
          return regExp.test(quick_reply.title)
        })
      : quick_replies

    return (
      <QuickReplies
        quick_replies={filterQuickReplies ? filteredQuickReplies : quick_replies}
        fgColor={this.props.fgColor}
        onQuickReplySend={this.props.onQuickReplySend}
        onFileUploadSend={this.props.onFileUploadSend}
      />
    )
  }

  renderForm() {
    const messages = this.props.messages || []
    const message = messages[messages.length - 1]
    if (message && message['message_raw'] && message['message_raw']['form']) {
      const form = message['message_raw']['form']
      return <Form elements={form.elements} formId={form.id} title={form.title} onFormSend={this.props.onFormSend} />
    }
  }

  renderDate(date) {
    return (
      <div className={'bp-date ' + style.date}>
        {format(new Date(date), 'MMMM Do YYYY, h:mm a')}
        <div className={style.smallLine} />
      </div>
    )
  }

  renderAvatar(name, url) {
    return <Avatar name={name} avatarUrl={url} height={40} width={40} />
  }

  renderMessageGroups() {
    const messages = this.props.messages || []
    const groups = []

    let lastSpeaker = null
    let lastDate = null
    let currentGroup = null

    messages.forEach(m => {
      const speaker = !!m.userId ? m.userId : 'bot'
      const date = m.sent_on

      // Create a new group if messages are separated by more than X minutes or if different speaker
      if (speaker !== lastSpeaker || differenceInMinutes(new Date(date), new Date(lastDate)) >= TIME_BETWEEN_DATES) {
        currentGroup = []
        groups.push(currentGroup)
      }

      currentGroup.push(m)

      lastSpeaker = speaker
      lastDate = date
    })

    if (this.props.typingUntil) {
      if (lastSpeaker !== 'bot') {
        currentGroup = []
        groups.push(currentGroup)
      }

      currentGroup.push({
        sent_on: new Date(),
        userId: null,
        message_type: 'typing'
      })
    }
    return (
      <div>
        {groups.map((group, i) => {
          const lastGroup = groups[i - 1]
          const lastDate = lastGroup && lastGroup[lastGroup.length - 1] && lastGroup[lastGroup.length - 1].sent_on
          const groupDate = group && group[0].sent_on

          const isDateNeeded =
            !groups[i - 1] || differenceInMinutes(new Date(groupDate), new Date(lastDate)) > TIME_BETWEEN_DATES

          const [{ userId, full_name: userName, avatar_url: avatarUrl }] = group

          const avatar = userId
            ? this.props.showUserAvatar && this.renderAvatar(userName, avatarUrl)
            : this.renderAvatar(this.props.botName, this.props.botAvatarUrl)

          return (
            <div key={i}>
              {isDateNeeded ? this.renderDate(group[0].sent_on) : null}
              <MessageGroup
                bp={this.props.bp}
                isBot={!userId}
                avatar={avatar}
                userName={userName}
                fgColor={this.props.fgColor}
                textColor={this.props.textColor}
                showUserAvatar={this.props.showUserAvatar}
                showUserName={this.props.showUserName}
                key={`msg-group-${i}`}
                onLoginPromptSend={this.props.onLoginPromptSend}
                isLastGroup={i >= groups.length - 1}
                messages={group}
                onSendData={this.props.onSendData}
              />
            </div>
          )
        })}
      </div>
    )
  }

  render() {
    return (
      <div
        tabIndex="-1"
        onKeyDown={this.handleKeyDown}
        className={'bp-messages ' + style.messages}
        ref={m => {
          this.messagesDiv = m
        }}
      >
        {this.renderMessageGroups()}
        {this.renderForm()}
        {this.renderQuickReplies()}
      </div>
    )
  }
}

class Message extends Component {
  getAddStyle() {
    return this.props.data.message_raw && this.props.data.message_raw['web-style']
  }

  getMarkdownElement() {
    let html = snarkdown(this.props.data.message_text || '')
    html = html.replace(/<a href/gi, `<a target="_blank" href`)

    return <div dangerouslySetInnerHTML={{ __html: html }} />
  }

  render_text() {
    const element =
      this.props.data.message_raw && this.props.data.message_raw.markdown ? (
        this.getMarkdownElement()
      ) : (
        <p style={this.getAddStyle()}>{this.props.data.message_text}</p>
      )
    return (
      <Linkify properties={{ target: '_blank' }}>
        <div>{element}</div>
      </Linkify>
    )
  }

  render_form() {
    return (
      <div>
        <p style={this.getAddStyle()}>{this.props.data.message_text}</p>
      </div>
    )
  }

  render_quick_reply() {
    return (
      <div>
        <p>{this.props.data.message_text}</p>
      </div>
    )
  }

  render_login_prompt() {
    const isLastMessage = this.props.isLastOfGroup && this.props.isLastGroup
    const isBotMessage = !this.props.data.userId

    return (
      <div style={this.getAddStyle()}>
        <LoginPrompt
          isLastMessage={isLastMessage}
          isBotMessage={isBotMessage}
          bgColor={this.props.bubbleColor}
          onLoginPromptSend={this.props.onLoginPromptSend}
          textColor={this.props.textColor}
        />
      </div>
    )
  }

  render_carousel() {
    return <CarouselMessage onSendData={this.props.onSendData} carousel={this.props.data.message_raw} />
  }

  render_typing() {
    const bubble = () => (
      <div
        className={style.typingBubble}
        style={{ backgroundColor: this.props.bubbleColor, color: this.props.textColor }}
      />
    )

    return (
      <div className={'bp-typing-indicator ' + style.typingGroup}>
        {bubble()}
        {bubble()}
        {bubble()}
      </div>
    )
  }

  render_file() {
    return <FileMessage file={this.props.data.message_data} />
  }

  render_custom() {
    const { module, component } = this.props.data.message_data || {}
    if (!module || !component) {
      return this.render_unsupported()
    }

    const InjectedModuleView = this.props.bp.getModuleInjector()

    const messageDataProps = { ...this.props.data.message_data }
    delete messageDataProps.module
    delete messageDataProps.component

    const props = {
      ..._.pick(this.props, ['isLastGroup', 'isLastOfGroup', 'onSendData']),
      ...messageDataProps
    }

    return <InjectedModuleView moduleName={module} componentName={component} lite={true} extraProps={props} />
  }

  render_session_reset() {
    return <div style={this.getAddStyle()}>{this.props.data.message_text}</div>
  }

  render_visit() {
    return null
  }

  render_postback() {
    return this.props.data.message_data.text || null
  }

  render_unsupported() {
    return (
      <div className="bp-msg-unsupported" style={this.getAddStyle()}>
        <p>*Unsupported message type*</p>
      </div>
    )
  }

  render() {
    const bubbleStyle = !!this.props.data.userId
      ? { backgroundColor: this.props.bubbleColor, color: this.props.textColor }
      : null

    const renderer = (this['render_' + this.props.data.message_type] || this.render_unsupported).bind(this)

    const rendered = renderer()
    if (rendered === null) {
      return null
    }

    return (
      <div
        className={classnames(
          'bp-msg',
          'bp-msg-type-' + this.props.data.message_type,
          style.bubble,
          style[this.props.data.message_type]
        )}
        style={bubbleStyle}
      >
        {rendered}
      </div>
    )
  }
}
