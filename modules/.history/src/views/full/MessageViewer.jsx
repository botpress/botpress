import React from 'react'
import { Icon, Button, Checkbox } from '@blueprintjs/core'
import { ModuleUI } from 'botpress/shared'

import { MessageGroup } from './MessageGroup'
import { MessageTaskBar } from './MessageTaskBar'
import { MessageInspector } from './MessageInspector'
import style from './style.scss'

const { SplashScreen } = ModuleUI

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
    if (!this.state.currentConversation) {
      return null
    }

    const lastMessages = this.props.messageGroups.length ? (
      <span>Last message on : {this.getLastMessageDate(this.props.messageGroups).toDateString()}</span>
    ) : (
      <span>No messages with current filters</span>
    )

    return (
      <div style={{ padding: '5px 0 0 10px' }}>
        <h5>
          <strong>Conversation {this.state.currentConversation}</strong> <small>({lastMessages})</small>
        </h5>
        <hr />
      </div>
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
          {this.renderHeader()}

          <div style={{ display: 'flex' }}>
            <div style={{ width: '70%', marginRight: 20 }}>
              {!!this.props.messageGroups.length && (
                <div style={{ padding: 5 }}>
                  <div style={{ borderBottom: '1px solid #eee', marginBottom: '10px' }}>
                    <Checkbox
                      checked={this.state.areAllMessagesSelected}
                      onChange={this.handleSelectAll}
                      label="Select All"
                    />
                  </div>
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
            <div>{this.state.focusedMessage && <MessageInspector focusedMessage={this.state.focusedMessage} />}</div>
          </div>
        </div>
      </div>
    )
  }
}
