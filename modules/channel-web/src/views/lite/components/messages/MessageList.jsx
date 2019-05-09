import React, { Component } from 'react'
import differenceInMinutes from 'date-fns/difference_in_minutes'

import MessageGroup from './MessageGroup'
import Avatar from '../common/Avatar'

import { injectIntl } from 'react-intl'

const TIME_BETWEEN_DATES = 10 // 10 minutes

class MessageList extends Component {
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
    setTimeout(() => {
      try {
        this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight
      } catch (err) {
        // Discard the error
      }
    }, 0)
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

  renderDate(date) {
    return (
      <div className={'bpw-date-container'}>
        {this.props.intl.formatTime(new Date(date), {
          hour12: false,
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric'
        })}
        <div className={'bpw-small-line'} />
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
                showUserAvatar={this.props.showUserAvatar}
                showUserName={this.props.showUserName}
                key={`msg-group-${i}`}
                isLastGroup={i >= groups.length - 1}
                messages={group}
                onSendData={this.props.onSendData}
                onFileUpload={this.props.onFileUpload}
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
        className={'bpw-msg-list'}
        ref={m => {
          this.messagesDiv = m
        }}
      >
        {this.renderMessageGroups()}
      </div>
    )
  }
}

export default injectIntl(MessageList)
