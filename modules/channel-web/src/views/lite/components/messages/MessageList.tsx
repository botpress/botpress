import differenceInMinutes from 'date-fns/difference_in_minutes'
import last from 'lodash/last'
import { observe } from 'mobx'
import { inject, observer } from 'mobx-react'
import React, { useEffect, useState } from 'react'
import { InjectedIntlProps, injectIntl } from 'react-intl'
import ScrollToBottom, { useScrollToBottom, useSticky } from 'react-scroll-to-bottom'

import constants from '../../core/constants'
import { RootStore, StoreDef } from '../../store'
import { Message } from '../../typings'
import Avatar from '../common/Avatar'

import MessageGroup from './MessageGroup'

interface State {
  showNewMessageIndicator: boolean
  messagesLength: number
}

class MessageList extends React.Component<MessageListProps, State> {
  private messagesDiv: HTMLElement

  componentDidMount() {
    observe(this.props.focusedArea, focus => {
      focus.newValue === 'convo' && this.messagesDiv?.focus()
    })
  }

  handleKeyDown = e => {
    if (!this.props.enableArrowNavigation) {
      return
    }

    const maxScroll = this.messagesDiv.scrollHeight - this.messagesDiv.clientHeight
    const shouldFocusNext =
      e.key === 'ArrowRight' || (e.key === 'ArrowDown' && this.messagesDiv.scrollTop === maxScroll)
    const shouldFocusPrevious = e.key === 'ArrowLeft' || (e.key === 'ArrowUp' && this.messagesDiv.scrollTop === 0)

    if (shouldFocusNext) {
      this.messagesDiv.blur()
      this.props.focusNext()
    }

    if (shouldFocusPrevious) {
      this.messagesDiv.blur()
      this.props.focusPrevious()
    }
  }

  render() {
    return (
      <ScrollToBottom
        mode={'bottom'}
        initialScrollBehavior={'auto'}
        tabIndex={0}
        className={'bpw-msg-list-scroll-container'}
        scrollViewClassName={'bpw-msg-list'}
        ref={m => {
          this.messagesDiv = m
        }}
        followButtonClassName={'bpw-msg-list-follow'}
      >
        <Content {...this.props} />
      </ScrollToBottom>
    )
  }
}

const Content = observer((props: MessageListProps) => {
  const [state, setState] = useState<State>({
    showNewMessageIndicator: false,
    messagesLength: undefined
  })
  const scrollToBottom = useScrollToBottom()
  const [sticky] = useSticky()

  useEffect(() => {
    const stateUpdate = { ...state, messagesLength: props.currentMessages?.length }
    if (!sticky && state.messagesLength !== props.currentMessages?.length) {
      setState({ ...stateUpdate, showNewMessageIndicator: !props?.alwaysScrollDownOnMessages })
      props?.alwaysScrollDownOnMessages && scrollToBottom()
    } else {
      setState({ ...stateUpdate, showNewMessageIndicator: false })
    }
  }, [props.currentMessages?.length, sticky])

  const shouldDisplayMessage = (m: Message): boolean => {
    return m.payload.type !== 'postback'
  }

  const renderAvatar = (name, url) => {
    const avatarSize = props.isEmulator ? 20 : 40 // quick fix
    return <Avatar name={name} avatarUrl={url} height={avatarSize} width={avatarSize} />
  }

  const renderDate = date => {
    return (
      <div className={'bpw-date-container'}>
        {new Intl.DateTimeFormat(props.intl.locale || 'en', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric'
        }).format(new Date(date))}
        <div className={'bpw-small-line'} />
      </div>
    )
  }

  const renderMessageGroups = () => {
    const messages = (props.currentMessages || []).filter(m => shouldDisplayMessage(m))
    const groups: Message[][] = []

    let lastSpeaker = undefined
    let lastDate = undefined
    let currentGroup = undefined

    messages.forEach(m => {
      const speaker = m.payload.channel?.web?.userName || m.authorId
      const date = m.sentOn

      // Create a new group if messages are separated by more than X minutes or if different speaker
      if (
        speaker !== lastSpeaker ||
        !currentGroup ||
        differenceInMinutes(new Date(date), new Date(lastDate)) >= constants.TIME_BETWEEN_DATES
      ) {
        currentGroup = []
        groups.push(currentGroup)
      }

      if (currentGroup.find(x => x.id === m.id)) {
        return
      }
      currentGroup.push(m)

      lastSpeaker = speaker
      lastDate = date
    })

    if (props.isBotTyping.get()) {
      if (lastSpeaker !== 'bot') {
        currentGroup = []
        groups.push(currentGroup)
      }

      currentGroup.push({
        sentOn: new Date(),
        userId: undefined,
        payload: { type: 'typing' }
      })
    }
    return (
      <div>
        {groups.map((group, i) => {
          const lastGroup = groups[i - 1]
          const lastDate = lastGroup?.[lastGroup.length - 1]?.sentOn
          const groupDate = group?.[0].sentOn

          const isDateNeeded =
            !groups[i - 1] ||
            differenceInMinutes(new Date(groupDate), new Date(lastDate)) > constants.TIME_BETWEEN_DATES

          const { authorId, payload } = last(group)

          const avatar = authorId
            ? props.showUserAvatar && renderAvatar(payload.channel?.web?.userName, payload.channel?.web?.avatarUrl)
            : renderAvatar(props.botName, payload.channel?.web?.avatarUrl || props.botAvatarUrl)

          return (
            <div key={i}>
              {isDateNeeded && renderDate(group[0].sentOn)}
              <MessageGroup
                isBot={!authorId}
                avatar={avatar}
                userName={payload.channel?.web?.userName}
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

  return (
    <>
      {state.showNewMessageIndicator && (
        <div className="bpw-new-messages-indicator" onClick={e => scrollToBottom()}>
          <span>
            {props.intl.formatMessage({
              id: `messages.newMessage${props.currentMessages?.length === 1 ? '' : 's'}`
            })}
          </span>
        </div>
      )}
      {renderMessageGroups()}
    </>
  )
})

export default inject(({ store }: { store: RootStore }) => ({
  intl: store.intl,
  isEmulator: store.isEmulator,
  botName: store.botName,
  isBotTyping: store.isBotTyping,
  botAvatarUrl: store.botAvatarUrl,
  currentMessages: store.currentMessages,
  focusPrevious: store.view.focusPrevious,
  focusNext: store.view.focusNext,
  focusedArea: store.view.focusedArea,
  showUserAvatar: store.config.showUserAvatar,
  enableArrowNavigation: store.config.enableArrowNavigation,
  preferredLanguage: store.preferredLanguage,
  alwaysScrollDownOnMessages: store.alwaysScrollDownOnMessages
}))(injectIntl(observer(MessageList)))

type MessageListProps = InjectedIntlProps &
  Pick<
    StoreDef,
    | 'intl'
    | 'isBotTyping'
    | 'focusedArea'
    | 'focusPrevious'
    | 'focusNext'
    | 'botAvatarUrl'
    | 'isEmulator'
    | 'botName'
    | 'enableArrowNavigation'
    | 'showUserAvatar'
    | 'currentMessages'
    | 'preferredLanguage'
    | 'alwaysScrollDownOnMessages'
  >
