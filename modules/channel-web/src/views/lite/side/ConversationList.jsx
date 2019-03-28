import React from 'react'
import style from './style.scss'

import distanceInWordsToNow from 'date-fns/distance_in_words_to_now'
import Add from '../icons/Add'

const ConversationListItem = ({ conversation, onClick, hasFocus }) => {
  const title = conversation.title || conversation.message_author || 'Untitled Conversation'
  const date = distanceInWordsToNow(new Date(conversation.message_sent_on || conversation.created_on))
  const message = conversation.message_text || '...'

  return (
    <div className={`bp-item ${style.item} ${hasFocus && style.focus}`} onClick={onClick}>
      <div className={style.right}>
        <div className={'bp-title ' + style.title}>
          <div className={style.name}>{title}</div>
          <div className={style.date}>
            <span>{date}</span>
          </div>
        </div>
        <div className={'bp-preview ' + style.text}>{message}</div>
      </div>
    </div>
  )
}

class ConversationList extends React.Component {
  state = {
    focusIdx: null
  }

  changeFocus = step => {
    let focusIdx = this.state.focusIdx || 0
    focusIdx += step

    if (focusIdx > this.props.conversations.length) {
      focusIdx = 0
    } else if (focusIdx < 0) {
      focusIdx = this.props.conversations.length
    }

    this.setState({ focusIdx })
  }

  componentDidMount() {
    this.main.focus()
  }

  componentDidUpdate(_, prevState) {
    if (this.state.focusIdx === this.props.conversations.length) {
      this.btn.focus()
    } else if (prevState.focusIdx === this.props.conversations.length) {
      this.main.focus()
    }
  }

  handleKeyDown = e => {
    if (!this.props.enableArrowNavigation) {
      return
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      this.changeFocus(1)
    } else if (e.key == 'ArrowUp' || e.key == 'ArrowLeft') {
      this.changeFocus(-1)
    } else if (e.key == 'Enter' && this.state.focusIdx && this.state.focusIdx < this.props.conversations.length) {
      const convoId = this.props.conversations[this.state.focusIdx].id
      this.props.onConversationClicked(convoId)
    }
  }

  render() {
    const { conversations, createConversation, onConversationClicked } = this.props
    return (
      <div
        tabIndex="0"
        ref={el => (this.main = el)}
        className={`bp-list-convo ${style.list}`}
        onKeyDown={this.handleKeyDown}
      >
        {conversations.map((convo, idx) => (
          <ConversationListItem
            key={convo.id}
            hasFocus={this.state.focusIdx == idx}
            conversation={convo}
            onClick={onConversationClicked.bind(this, convo.id)}
          />
        ))}
        <button
          ref={el => (this.btn = el)}
          className={'bp-new-convo-btn ' + style.addConvoBtn}
          onClick={createConversation}
        >
          <Add width={15} height={15} />
        </button>
      </div>
    )
  }
}

export default ConversationList
