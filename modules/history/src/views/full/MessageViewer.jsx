import React from 'react'
import style from './style.scss'

import classnames from 'classnames'
import { MessageGroup } from './MessageGroup'
import { MessagesHeader } from './MessagesHeader'
import { MessageInspector } from './MessageInspector'

import { IoMdFlag } from 'react-icons/io'

import ReactTooltip from 'react-tooltip'

function NoConversationSelected() {
  return (
    <div className={style['message-list']}>
      <div className={style['no-conv']}>
        <h3>No conversations selected</h3>
        <p>
          Please select a conversation on the left pane to see a message history. If there are no conversations
          available, try talking to your bot and refresh conversations by clicking on the round arrow
        </p>
      </div>
    </div>
  )
}

class MessagesTaskBar extends React.Component {
  state = {
    filters: {
      flag: false
    },
    currentConv: null
  }

  componentDidUpdate() {
    if (this.props.currentConv !== this.state.currentConv) {
      this.setState({ currentConv: this.props.currentConv, filters: { flag: false } })
    }
  }

  toggleFlagFilter() {
    this.state.filters.flag = !this.state.filters.flag
    this.props.updateFilters(this.state.filters)
  }

  render() {
    return (
      <div className={style.messageTaskBar}>
        {!this.props.useAsFilter && (
          <div className={style.messageTaskBarFilter}>
            <div>
              <IoMdFlag
                className={style.messageTaskBarFlagIcon}
                data-tip
                data-for="flag"
                onClick={() => this.props.flag()}
              />
              <ReactTooltip id="flag" effect="solid">
                <div>Mark selected messages as not good</div>
              </ReactTooltip>
            </div>
            <div>
              <IoMdFlag
                className={style.messageTaskBarUnflagIcon}
                data-tip
                data-for="unflag"
                onClick={() => this.props.unflag()}
              />
              <ReactTooltip id="unflag" effect="solid">
                <div>Unflag Selected messages</div>
              </ReactTooltip>
            </div>
          </div>
        )}
        {this.props.useAsFilter && (
          <div>
            <span>Display only flagged messages:</span>
            <input type="checkbox" checked={this.state.filters.flag} onChange={() => this.toggleFlagFilter()} />
          </div>
        )}
      </div>
    )
  }
}

export class MessageViewer extends React.Component {
  state = {
    inspectorIsShown: false,
    currentlyFocusedMessage: null,
    areMessagesSelected: false,
    areAllMessagesSelected: false,
    filters: { flag: false },
    selectedGroups: [],
    currentConversation: null
  }

  componentDidUpdate() {
    if (this.props.conversation !== this.state.currentConversation) {
      this.unselectAll()
      this.setState({ currentConversation: this.props.conversation })
    }
  }

  handleSelection(isSelected, group) {
    let currentSelectedLength = this.state.selectedGroups.length
    if (isSelected) {
      currentSelectedLength += 1
      this.selectMessage(group)
    } else {
      currentSelectedLength -= 1
      this.unselectMessage(group)
    }
    this.setState({
      areMessagesSelected: currentSelectedLength >= 0,
      areAllMessagesSelected: currentSelectedLength >= this.props.messageGroups.length
    })
  }

  selectMessage(group) {
    const selectedGroupsCpy = [...this.state.selectedGroups]
    selectedGroupsCpy.push(group)
    this.setState({ selectedGroups: selectedGroupsCpy })
  }

  unselectMessage(message) {
    const selectedGroupsCpy = [...this.state.selectedGroups]
    const idx = selectedGroupsCpy.indexOf(message)
    if (idx !== -1) {
      selectedGroupsCpy.splice(idx, 1)
    }
    this.setState({ selectedGroups: selectedGroupsCpy })
  }

  unselectAll() {
    this.setState({ selectedGroups: [], areMessagesSelected: false, areAllMessagesSelected: false })
  }

  selectAll() {
    this.setState({
      selectedGroups: [...this.props.messageGroups],
      areMessagesSelected: true,
      areAllMessagesSelected: true
    })
  }

  handleSelectAll() {
    if (this.state.areAllMessagesSelected) {
      this.unselectAll()
    } else {
      this.selectAll()
    }
  }

  async flagSelectedMessages() {
    await this.props.flagMessages(this.state.selectedGroups)
    this.unSelectAndUpdate()
  }

  async unflagSelectedMessages() {
    await this.props.unflagMessages(this.state.selectedGroups)
    this.unSelectAndUpdate()
  }

  unSelectAndUpdate() {
    this.unselectAll()
    if (this.state.filters) {
      this.updateFilters(this.state.filters)
    }
  }

  updateFilters(f) {
    this.setState({ filters: f })
    this.props.updateConversationWithFilters(f)
  }

  render() {
    if (!this.props.conversation) {
      return <NoConversationSelected />
    }
    return (
      <div className={style['message-viewer']}>
        <div
          className={classnames(
            style['message-list'],
            this.state.inspectorIsShown ? style['message-list-partial'] : style['message-list-full']
          )}
        >
          <MessagesHeader conversation={this.state.currentConversation} messageGroups={this.props.messageGroups} />
          <MessagesTaskBar
            ref="taskBar"
            useAsFilter={!this.state.areMessagesSelected}
            flag={() => this.flagSelectedMessages()}
            unflag={() => this.unflagSelectedMessages()}
            updateFilters={f => this.updateFilters(f)}
            currentConv={this.state.currentConversation}
          />
          {!!this.props.messageGroups.length && (
            <div>
              select all:
              <input
                type="checkbox"
                checked={this.state.areAllMessagesSelected}
                onChange={() => this.handleSelectAll()}
              />
              {this.props.messageGroups.map(group => {
                return (
                  <MessageGroup
                    key={group.userMessage.id}
                    group={group}
                    focusMessage={m => this.setState({ currentlyFocusedMessage: m, inspectorIsShown: true })}
                    isSelected={this.state.selectedGroups.includes(group)}
                    handleSelection={(isSelected, m) => this.handleSelection(isSelected, m)}
                  />
                )
              })}
            </div>
          )}
          {this.props.isThereStillMessagesLeft && (
            <div className={style['fetch-more']} onClick={() => this.props.fetchNewMessages(this.state.filters)}>
              Load More...
            </div>
          )}
        </div>
        <MessageInspector
          currentlyFocusedMessage={this.state.currentlyFocusedMessage}
          closeInspector={() => this.setState({ inspectorIsShown: false })}
        />
      </div>
    )
  }
}
