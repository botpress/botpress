import React from 'react'

import Reload from '../icons/Reload'
import List from '../icons/List'
import Close from '../icons/Close'
import Download from '../icons/Download'
import Information from '../icons/Information'
import Avatar from './common/Avatar'

import { injectIntl } from 'react-intl'

class Header extends React.Component {
  btnEls = {}
  state = {
    currentFocusIdx: null
  }

  onBlur = () => {
    this.setCurrentFocusIdx(null)
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.focused && this.props.focused) {
      this.changeButtonFocus(1)
    }
  }

  setCurrentFocusIdx = currentFocusIdx => {
    this.setState({ currentFocusIdx })
  }

  changeButtonFocus = step => {
    let idx = this.state.currentFocusIdx !== null ? this.state.currentFocusIdx + step : 0

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

  renderAvatar = () => {
    const avatarUrl =
      (this.props.botInfo.details && this.props.botInfo.details.avatarUrl) || this.props.config.avatarUrl
    return <Avatar name={this.props.botName} avatarUrl={avatarUrl} height={40} width={40} />
  }

  renderTitle = () => {
    const title = this.props.showConvos
      ? this.props.intl.formatMessage({ id: 'header.conversations' })
      : this.props.botName
    const description = this.props.config.botConvoDescription
    const hasDescription = description && description.length > 0

    return (
      <div className={'bpw-header-title'}>
        <div className={'bpw-header-name'}>
          {title}
          {this.props.unreadCount > 0 && <span className={'bpw-header-unread'}>{this.props.unreadCount}</span>}
        </div>
        {hasDescription && <div className={'bpw-header-subtitle'}>{description}</div>}
      </div>
    )
  }

  renderResetButton() {
    return (
      !this.props.showConvos &&
      !this.props.showBotInfo &&
      this.props.config.enableReset && (
        <span
          tabIndex="-1"
          ref={el => (this.btnEls[0] = el)}
          className={'bpw-header-icon bpw-header-icon-reset'}
          onClick={this.props.onResetClicked}
          onKeyDown={this.handleKeyDown.bind(this, this.props.onResetClicked)}
          onBlur={this.onBlur}
        >
          <Reload />
        </span>
      )
    )
  }

  renderDownloadButton() {
    return (
      !this.props.showConvos &&
      !this.props.showBotInfo &&
      this.props.config.enableTranscriptDownload && (
        <span
          tabIndex="-1"
          ref={el => (this.btnEls[1] = el)}
          className={'bpw-header-icon bpw-header-icon-download'}
          onClick={this.props.onDownloadClicked}
          onKeyDown={this.handleKeyDown.bind(this, this.props.onDownloadClicked)}
          onBlur={this.onBlur}
        >
          <Download />
        </span>
      )
    )
  }

  renderConvoButton() {
    return (
      this.props.config.showConversationsButton && (
        <span
          tabIndex="-1"
          ref={el => (this.btnEls[2] = el)}
          className={'bpw-header-icon bpw-header-icon-convo'}
          onClick={this.props.onListClicked}
          onKeyDown={this.handleKeyDown.bind(this, this.props.onListClicked)}
          onBlur={this.onBlur}
        >
          <List />
        </span>
      )
    )
  }

  renderBotInfoButton() {
    return (
      !this.props.showConvos &&
      this.props.botInfo.showBotInfoPage && (
        <span
          tabIndex="-1"
          ref={el => (this.btnEls[3] = el)}
          className={'bpw-header-icon bpw-header-icon-botinfo'}
          onClick={this.props.onInfoClicked}
          onKeyDown={this.handleKeyDown.bind(this, this.props.onInfoClicked)}
          onBlur={this.onBlur}
        >
          <Information />
        </span>
      )
    )
  }

  renderCloseButton() {
    return (
      this.props.onCloseClicked && (
        <span
          tabIndex="-1"
          ref={el => (this.btnEls[4] = el)}
          className={'bpw-header-icon bpw-header-icon-close'}
          onClick={this.props.onCloseClicked}
          onKeyDown={this.handleKeyDown.bind(this, this.props.onCloseClicked)}
          onBlur={this.onBlur}
        >
          <Close />
        </span>
      )
    )
  }

  handleKeyDown = (action, e) => {
    if (!this.props.config || (this.props.config && !this.props.config.enableArrowNavigation)) {
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

export default injectIntl(Header)
