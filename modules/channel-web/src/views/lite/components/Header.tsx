import { observe } from 'mobx'
import { inject, observer } from 'mobx-react'
import React from 'react'

import Close from '../icons/Close'
import Download from '../icons/Download'
import Information from '../icons/Information'
import List from '../icons/List'
import Reload from '../icons/Reload'
import { RootStore, StoreDef } from '../store'

import Avatar from './common/Avatar'

class Header extends React.Component<HeaderProps> {
  private btnEls: { [index: number]: HTMLElement } = {}

  state = {
    currentFocusIdx: undefined
  }

  componentDidMount() {
    observe(this.props.focusedArea, focus => {
      focus.newValue === 'header' && this.changeButtonFocus(1)
    })
  }

  onBlur = () => {
    this.setCurrentFocusIdx(undefined)
  }

  setCurrentFocusIdx = currentFocusIdx => {
    this.setState({ currentFocusIdx })
  }

  changeButtonFocus = step => {
    let idx: number = this.state.currentFocusIdx !== null ? this.state.currentFocusIdx + step : 0

    if (idx < 0) {
      this.onBlur()
      this.props.focusPrevious()
    }

    for (idx; idx < Object.keys(this.btnEls).length; idx++) {
      if (this.btnEls[idx]) {
        this.btnEls[idx].focus()
        this.setCurrentFocusIdx(idx)
        break
      }
    }

    if (idx == Object.keys(this.btnEls).length) {
      this.onBlur()
      this.props.focusNext()
    }
  }

  renderTitle = () => {
    const title = this.props.isConversationsDisplayed
      ? this.props.intl.formatMessage({ id: 'header.conversations' })
      : this.props.botName

    return (
      <div className={'bpw-header-title'}>
        <div className={'bpw-header-name'}>
          {title}
          {this.props.hasUnreadMessages && <span className={'bpw-header-unread'}>{this.props.unreadCount}</span>}
        </div>
        {this.props.hasBotInfoDescription && (
          <div className={'bpw-header-subtitle'}>{this.props.botConvoDescription}</div>
        )}
      </div>
    )
  }

  renderResetButton() {
    return (
      <span
        tabIndex={-1}
        ref={el => (this.btnEls[0] = el)}
        className={'bpw-header-icon bpw-header-icon-reset'}
        onClick={this.props.resetSession}
        onKeyDown={this.handleKeyDown.bind(this, this.props.resetSession)}
        onBlur={this.onBlur}
      >
        <Reload />
      </span>
    )
  }

  renderDownloadButton() {
    return (
      <span
        tabIndex={-1}
        ref={el => (this.btnEls[1] = el)}
        className={'bpw-header-icon bpw-header-icon-download'}
        onClick={this.props.downloadConversation}
        onKeyDown={this.handleKeyDown.bind(this, this.props.downloadConversation)}
        onBlur={this.onBlur}
      >
        <Download />
      </span>
    )
  }

  renderConvoButton() {
    return (
      <span
        tabIndex={-1}
        ref={el => (this.btnEls[2] = el)}
        className={'bpw-header-icon bpw-header-icon-convo'}
        onClick={this.props.toggleConversations}
        onKeyDown={this.handleKeyDown.bind(this, this.props.toggleConversations)}
        onBlur={this.onBlur}
      >
        <List />
      </span>
    )
  }

  renderBotInfoButton() {
    return (
      <span
        tabIndex={-1}
        ref={el => (this.btnEls[3] = el)}
        className={'bpw-header-icon bpw-header-icon-botinfo'}
        onClick={this.props.toggleBotInfo}
        onKeyDown={this.handleKeyDown.bind(this, this.props.toggleBotInfo)}
        onBlur={this.onBlur}
      >
        <Information />
      </span>
    )
  }

  renderCloseButton() {
    return (
      <span
        tabIndex={-1}
        ref={el => (this.btnEls[4] = el)}
        className={'bpw-header-icon bpw-header-icon-close'}
        onClick={this.props.hideChat}
        onKeyDown={this.handleKeyDown.bind(this, this.props.hideChat)}
        onBlur={this.onBlur}
      >
        <Close />
      </span>
    )
  }

  renderCustomButtons() {
    return this.props.customButtons.map(btn => {
      const Icon: any = btn.icon
      return (
        <span
          key={btn.id}
          tabIndex={-1}
          className={'bpw-header-icon'}
          onClick={btn.onClick.bind(this, btn.id, this)}
          title={btn.label || ''}
        >
          {typeof Icon === 'function' ? <Icon /> : Icon}
        </span>
      )
    })
  }

  handleKeyDown = (action, e) => {
    if (!this.props.enableArrowNavigation) {
      return
    }

    if (e.key == 'ArrowUp') {
      this.props.focusPrevious()
    } else if (e.key == 'ArrowDown') {
      this.props.focusNext()
    } else if (e.key == 'ArrowLeft') {
      this.changeButtonFocus(-1)
    } else if (e.key == 'ArrowRight') {
      this.changeButtonFocus(1)
    } else if (e.key == 'Enter') {
      e.preventDefault()
      action()
    }
  }

  render() {
    return (
      <div className={'bpw-header-container'}>
        <div className={'bpw-header-title-flexbox'}>
          <div className={'bpw-header-title-container'}>
            <Avatar name={this.props.botName} avatarUrl={this.props.botAvatarUrl} height={40} width={40} />
            {this.renderTitle()}
          </div>
        </div>
        {!!this.props.customButtons.length && this.renderCustomButtons()}
        {this.props.showResetButton && this.renderResetButton()}
        {this.props.showDownloadButton && this.renderDownloadButton()}
        {this.props.showConversationsButton && this.renderConvoButton()}
        {this.props.showBotInfoButton && this.renderBotInfoButton()}
        {this.props.showCloseButton && this.renderCloseButton()}
      </div>
    )
  }
}

export default inject(({ store }: { store: RootStore }) => ({
  intl: store.intl,
  isConversationsDisplayed: store.view.isConversationsDisplayed,
  showDownloadButton: store.view.showDownloadButton,
  showBotInfoButton: store.view.showBotInfoButton,
  showConversationsButton: store.view.showConversationsButton,
  showResetButton: store.view.showResetButton,
  showCloseButton: store.view.showCloseButton,
  hasUnreadMessages: store.view.hasUnreadMessages,
  unreadCount: store.view.unreadCount,
  focusPrevious: store.view.focusPrevious,
  focusNext: store.view.focusNext,
  focusedArea: store.view.focusedArea,
  hideChat: store.view.hideChat,
  toggleConversations: store.view.toggleConversations,
  toggleBotInfo: store.view.toggleBotInfo,
  customButtons: store.view.customButtons,

  resetSession: store.resetSession,
  downloadConversation: store.downloadConversation,
  botName: store.botName,
  botAvatarUrl: store.botAvatarUrl,
  hasBotInfoDescription: store.hasBotInfoDescription,

  botConvoDescription: store.config.botConvoDescription,
  enableArrowNavigation: store.config.enableArrowNavigation
}))(observer(Header))

type HeaderProps = Pick<
  StoreDef,
  | 'intl'
  | 'sendMessage'
  | 'focusPrevious'
  | 'focusNext'
  | 'focusedArea'
  | 'isConversationsDisplayed'
  | 'botName'
  | 'hasUnreadMessages'
  | 'unreadCount'
  | 'hasBotInfoDescription'
  | 'resetSession'
  | 'downloadConversation'
  | 'toggleConversations'
  | 'hideChat'
  | 'toggleBotInfo'
  | 'botAvatarUrl'
  | 'showResetButton'
  | 'showDownloadButton'
  | 'showConversationsButton'
  | 'showBotInfoButton'
  | 'showCloseButton'
  | 'enableArrowNavigation'
  | 'botConvoDescription'
  | 'customButtons'
>
