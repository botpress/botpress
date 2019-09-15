import differenceInMinutes from 'date-fns/difference_in_minutes'
import { observe } from 'mobx'
import { inject, observer } from 'mobx-react'
import React from 'react'

import constants from '../../core/constants'
import { RootStore, StoreDef } from '../../store'
import Avatar from '../common/Avatar'

import MessageGroup from './MessageGroup'

class MessageList extends React.Component<MessageListProps> {
  private messagesDiv: HTMLElement

  componentDidMount() {
    this.tryScrollToBottom(true)

    observe(this.props.focusedArea, focus => {
      focus.newValue === 'convo' && this.messagesDiv.focus()
    })
  }

  componentDidUpdate() {
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
    const messages = this.props.currentMessages || []
    const groups = []

    let lastSpeaker = undefined
    let lastDate = undefined
    let currentGroup = undefined

    messages.forEach(m => {
      const speaker = !!m.userId ? m.userId : 'bot'
      const date = m.sent_on

      // Create a new group if messages are separated by more than X minutes or if different speaker
      if (
        speaker !== lastSpeaker ||
        differenceInMinutes(new Date(date), new Date(lastDate)) >= constants.TIME_BETWEEN_DATES
      ) {
        currentGroup = []
        groups.push(currentGroup)
      }

      currentGroup.push(m)

      lastSpeaker = speaker
      lastDate = date
    })

    if (this.props.isBotTyping.get()) {
      if (lastSpeaker !== 'bot') {
        currentGroup = []
        groups.push(currentGroup)
      }

      currentGroup.push({
        sent_on: new Date(),
        userId: undefined,
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
            !groups[i - 1] ||
            differenceInMinutes(new Date(groupDate), new Date(lastDate)) > constants.TIME_BETWEEN_DATES

          const [{ userId, full_name: userName, avatar_url: avatarUrl }] = group

          const avatar = userId
            ? this.props.showUserAvatar && this.renderAvatar(userName, avatarUrl)
            : this.renderAvatar(this.props.botName, this.props.botAvatarUrl)

          return (
            <div key={i}>
              {isDateNeeded && this.renderDate(group[0].sent_on)}
              <MessageGroup
                isBot={!userId}
                avatar={avatar}
                userName={userName}
                key={`msg-group-${i}`}
                isLastGroup={i >= groups.length - 1}
                messages={group}
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
        tabIndex={-1}
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

export default inject(({ store }: { store: RootStore }) => ({
  intl: store.intl,
  botName: store.botName,
  isBotTyping: store.isBotTyping,
  botAvatarUrl: store.botAvatarUrl,
  currentMessages: store.currentMessages,
  focusPrevious: store.view.focusPrevious,
  focusNext: store.view.focusNext,
  focusedArea: store.view.focusedArea,
  showUserAvatar: store.config.showUserAvatar,
  enableArrowNavigation: store.config.enableArrowNavigation
}))(observer(MessageList))

type MessageListProps = Pick<
  StoreDef,
  | 'intl'
  | 'isBotTyping'
  | 'focusedArea'
  | 'focusPrevious'
  | 'focusNext'
  | 'botAvatarUrl'
  | 'botName'
  | 'enableArrowNavigation'
  | 'showUserAvatar'
  | 'currentMessages'
>
