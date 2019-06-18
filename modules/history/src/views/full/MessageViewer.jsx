import React from 'react'
import style from './style.scss'

import classnames from 'classnames'
import { MessageGroup } from './MessageGroup'
import { MessageInspector } from './MessageInspector'

import { SplashScreen } from 'botpress/ui'
import { Icon, Button } from '@blueprintjs/core'

import { MessageTaskBar } from './MessageTaskBar'

function NoConversationSelected() {
  return (
    <SplashScreen
      icon={<Icon className={style.noConvIcon} iconSize={80} icon="history" />}
      title={'Message history'}
      description="There is currently no conversation selected. Please select a conversation on the left pane to see a message history. If there are no conversations
    available, try talking to your bot and refresh conversations by clicking on the round arrow"
    />
  )
}

export class MessageViewer extends React.Component {
  state = {
    inspectorIsShown: false,
    focusedMessage: null,
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

  handleSelection = (isSelected, group) => {
    let currentSelectedLength = this.state.selectedGroups.length
    if (isSelected) {
      currentSelectedLength += 1
      this.selectMessage(group)
    } else {
      currentSelectedLength -= 1
      this.unselectMessage(group)
    }
    this.setState({
      areMessagesSelected: currentSelectedLength > 0,
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

  handleSelectAll = () => {
    if (this.state.areAllMessagesSelected) {
      this.unselectAll()
    } else {
      this.selectAll()
    }
  }

  flagSelectedMessages = async () => {
    await this.props.flagMessages(this.state.selectedGroups)
    this.unSelectAndUpdate()
  }

  unflagSelectedMessages = async () => {
    await this.props.unflagMessages(this.state.selectedGroups)
    this.unSelectAndUpdate()
  }

  unSelectAndUpdate() {
    this.unselectAll()
    if (this.state.filters) {
      this.updateFilters(this.state.filters)
    }
  }

  updateFilters = f => {
    this.setState({ filters: f })
    this.props.updateConversationWithFilters(f)
  }

  getLastMessageDate = messageGroups => {
    const maxDateMessage = _.maxBy(messageGroups, mg => mg.userMessage.createdOn)
    return new Date(maxDateMessage.userMessage.createdOn)
  }

  renderHeader() {
    return (
      this.state.currentConversation && (
        <React.Fragment>
          <div className={style['message-title']}>Conversation {this.state.currentConversation}</div>
          {!!this.props.messageGroups.length && (
            <div className={style['message-lastdate']}>
              Last message on : #{this.getLastMessageDate(this.props.messageGroups).toDateString()}
            </div>
          )}
          {!this.props.messageGroups.length && (
            <div className={style['message-lastdate']}>No messages with current filters</div>
          )}
        </React.Fragment>
      )
    )
  }

  render() {
    if (!this.props.conversation) {
      return <NoConversationSelected />
    }
    return (
      <div style={{ height: '100%' }}>
        <MessageTaskBar
          selectedCount={this.state.selectedGroups.length}
          useAsFilter={!this.state.areMessagesSelected}
          flag={this.flagSelectedMessages}
          unflag={this.unflagSelectedMessages}
          updateFilters={this.updateFilters}
          currentConv={this.state.currentConversation}
          messageGroups={this.props.messageGroups}
        />
        <div className={style['message-viewer']}>
          <div
            className={classnames(
              style['message-list'],
              this.state.inspectorIsShown ? style['message-list-partial'] : style['message-list-full']
            )}
          >
            {this.renderHeader()}
            {!!this.props.messageGroups.length && (
              <div>
                select all:
                <input type="checkbox" checked={this.state.areAllMessagesSelected} onChange={this.handleSelectAll} />
                {this.props.messageGroups.map(group => {
                  return (
                    <MessageGroup
                      key={group.userMessage.id}
                      group={group}
                      focusMessage={focusedMessage => this.setState({ focusedMessage, inspectorIsShown: true })}
                      isSelected={this.state.selectedGroups.includes(group)}
                      handleSelection={this.handleSelection}
                    />
                  )
                })}
              </div>
            )}
            {this.props.isThereStillMessagesLeft && (
              <div className={style['fetch-more']}>
                <Button onClick={() => this.props.fetchNewMessages(this.state.filters)} minimal>
                  Load More...
                </Button>
              </div>
            )}
          </div>
          <MessageInspector
            focusedMessage={this.state.focusedMessage}
            closeInspector={() => this.setState({ inspectorIsShown: false })}
          />
        </div>
      </div>
    )
  }
}
