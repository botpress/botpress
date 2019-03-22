import React from 'react'

import style from './style.scss'
import Reload from '../icons/Reload'
import List from '../icons/List'
import Close from '../icons/Close'
import Download from '../icons/Download'
import Information from '../icons/Information'
import Avatar from '../avatar'

class Header extends React.Component {
  renderAvatar() {
    const name = this.props.botInfo.name || this.props.config.botName
    const avatarUrl =
      (this.props.botInfo.details && this.props.botInfo.details.avatarUrl) || this.props.config.avatarUrl
    return <Avatar name={name} avatarUrl={avatarUrl} height={40} width={40} />
  }

  renderTitle() {
    const title = this.props.showConvos ? 'Conversations' : this.props.config.botConvoTitle
    const description = this.props.config.botConvoDescription
    const hasDescription = description && description.length > 0

    return (
      <div className={style.title}>
        <div className={style.name}>
          {title}
          {this.props.unreadCount > 0 && <span className={style.unread}>{this.props.unreadCount}</span>}
        </div>
        {hasDescription && <div className={style.status}>{description}</div>}
      </div>
    )
  }

  renderConvoButton() {
    return (
      this.props.config.showConversationsButton && (
        <span className={'bp-convos-btn ' + style.icon} onClick={this.props.onListClicked}>
          <List />
        </span>
      )
    )
  }

  renderCloseButton() {
    return (
      this.props.onClose && (
        <span className={'bp-close-btn ' + style.icon} onClick={this.props.onCloseClicked}>
          <Close />
        </span>
      )
    )
  }

  renderResetButton() {
    return (
      !this.props.showConvos &&
      this.props.config && (
        <span className={'bp-reset-btn ' + style.icon} onClick={this.props.onResetClicked}>
          <Reload />
        </span>
      )
    )
  }

  renderDownloadButton() {
    return (
      !this.props.showConvos &&
      this.props.config.enableTranscriptDownload && (
        <span className={'bp-transcript-btn ' + style.icon} onClick={this.props.onDownloadClicked}>
          <Download />
        </span>
      )
    )
  }

  renderBotInfoButton() {
    return (
      !this.props.showConvos &&
      this.props.botInfo.showBotInfoPage && (
        <span className={'bp-bot-info-btn ' + style.icon} onClick={this.props.onInfoClicked}>
          <Information />
        </span>
      )
    )
  }

  render() {
    return (
      <div tabindex="-1" className={'bp-chat-header ' + style.header}>
        <div className={style.left}>
          <div className={style.line}>
            {this.renderAvatar()}
            {this.renderTitle()}
          </div>
        </div>
        {this.renderResetButton()}
        {this.renderDownloadButton()}
        {this.renderConvoButton()}
        {this.renderBotInfoButton()}
        {this.renderCloseButton()}
      </div>
    )
  }
}

export default Header
