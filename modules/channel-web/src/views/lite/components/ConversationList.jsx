import React from 'react'

import Add from '../icons/Add'

import { injectIntl } from 'react-intl'

const ConversationListItem = injectIntl(({ conversation, onClick, hasFocus, intl }) => {
  const title =
    conversation.title ||
    conversation.message_author ||
    intl.formatMessage({ id: 'conversationList.untitledConversation', defaultMessage: 'Untitled Conversation' })
  const date = intl.formatRelative(conversation.message_sent_on || conversation.created_on)
  const message = conversation.message_text || '...'

  return (
    <div className={'bpw-convo-item'} onClick={onClick}>
      <div className={'bpw-align-right'}>
        <div className={'bpw-title'}>
          <div>{title}</div>
          <div className={'bpw-date'}>
            <span>{date}</span>
          </div>
        </div>
        <div className={'bpw-convo-preview'}>{message}</div>
      </div>
    </div>
  )
})

class ConversationList extends React.Component {
  state = {
    focusIdx: null
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
      <div tabIndex="0" ref={el => (this.main = el)} className={'bpw-convo-list'} onKeyDown={this.handleKeyDown}>
        {conversations.map((convo, idx) => (
          <ConversationListItem
            key={convo.id}
            hasFocus={this.state.focusIdx == idx}
            conversation={convo}
            onClick={onConversationClicked.bind(this, convo.id)}
          />
        ))}
        <button ref={el => (this.btn = el)} className={'bpw-convo-add-btn'} onClick={createConversation}>
          <Add width={15} height={15} />
        </button>
      </div>
    )
  }
}

export default ConversationList
