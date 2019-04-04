import React from 'react'
import classnames from 'classnames'

import * as Keyboard from './Keyboard'
import ConversationList from './ConversationList'
import Composer from './Composer'
import Header from './Header'
import BotInfo from './common/BotInfo'
import MessageList from './messages/MessageList'

import { getOverridedComponent } from '../utils'

export default class Container extends React.Component {
  state = {
    currentFocus: 'input',
    showConvos: false,
    showBotInfo: false
  }

  // TODO replace this with componentDidUpdate as this method is deprecated
  componentWillReceiveProps(nextProps) {
    let showConvos = this.state.showConvos
    if (!this.props.currentConversation && nextProps.currentConversation) {
      showConvos = false
    }

    const convosDiffers =
      !this.props.currentConversation ||
      (nextProps.currentConversation && this.props.currentConversation.id !== nextProps.currentConversation.id)

    const showBotInfo =
      (!showConvos && this.state.showBotInfo) ||
      (this.props.botInfo.showBotInfoPage && !this.isConvoStarted(nextProps.currentConversation) && convosDiffers)

    if (showConvos != this.state.showConvos || showBotInfo != this.state.showBotInfo) {
      this.setState({
        showConvos,
        showBotInfo
      })
    }
  }

  isConvoStarted = conversation => conversation && !!conversation.messages.length
  handleFocusChanged = nextFocus => this.setState({ currentFocus: nextFocus })
  handleToggleShowConvos = () => this.setState({ showConvos: !this.state.showConvos })
  toggleBotInfo = () => this.setState({ showBotInfo: !this.state.showBotInfo })

  handleConvoClicked = convoId => {
    this.props.onSwitchConvo && this.props.onSwitchConvo(convoId)
    this.handleToggleShowConvos()
  }

  renderHeader() {
    return (
      <Header
        focused={this.state.currentFocus === 'header'}
        showConvos={this.state.showConvos}
        showBotInfo={this.state.showBotInfo}
        botInfo={this.props.botInfo}
        config={this.props.config}
        currentConversation={this.props.currentConversation}
        unreadCount={this.props.unreadCount}
        onResetClicked={this.props.onResetSession}
        onDownloadClicked={this.props.downloadConversation}
        onCloseClicked={this.props.onClose}
        onListClicked={this.handleToggleShowConvos}
        onInfoClicked={this.toggleBotInfo}
        focusNext={this.handleFocusChanged.bind(this, 'convo')}
        focusPrevious={this.handleFocusChanged.bind(this, 'input')}
      />
    )
  }

  renderComposer() {
    const focused = this.state.currentFocus === 'input' && !this.state.showConvos && !this.state.showBotInfo
    const name = this.props.config.botName || 'Bot'
    const Component = getOverridedComponent(this.props.config.overrides, 'composer')

    if (Component) {
      return <Component original={{ Composer }} name={name} {...this.props} />
    }

    return (
      <Keyboard.Default>
        <Composer
          placeholder={'Reply to ' + name}
          send={this.props.onTextSend}
          change={this.props.onTextChanged}
          text={this.props.text}
          recallHistory={this.props.recallHistory}
          focused={focused}
          onFocus={this.handleFocusChanged.bind(this, 'input')}
          focusNext={this.handleFocusChanged.bind(this, 'header')}
          focusPrevious={this.handleFocusChanged.bind(this, 'convo')}
          config={this.props.config}
          onFileUpload={this.props.onFileUpload}
          onSendData={this.props.onSendData}
        />
      </Keyboard.Default>
    )
  }

  renderConversation() {
    const messagesProps = {
      bp: this.props.bp,
      typingUntil: this.props.currentConversation && this.props.currentConversation.typingUntil,
      messages: this.props.currentConversation && this.props.currentConversation.messages,
      botName: this.props.botInfo.name || this.props.config.botName,
      botAvatarUrl: (this.props.botInfo.details && this.props.botInfo.details.avatarUrl) || this.props.config.avatarUrl,
      showUserName: this.props.config && this.props.config.showUserName,
      showUserAvatar: this.props.config && this.props.config.showUserAvatar,
      onFileUpload: this.props.onFileUpload,
      onSendData: this.props.onSendData,
      focused: this.state.currentFocus === 'convo',
      focusNext: this.handleFocusChanged.bind(this, 'input'),
      focusPrevious: this.handleFocusChanged.bind(this, 'header'),
      enableArrowNavigation: this.props.config && this.props.config.enableArrowNavigation
    }

    return (
      <div className={'bpw-msg-list-container'}>
        <MessageList {...messagesProps} />
        {this.renderComposer()}
      </div>
    )
  }

  renderBody() {
    if (this.state.showConvos) {
      return (
        <ConversationList
          enableArrowNavigation={this.props.config && this.props.config.enableArrowNavigation}
          conversations={this.props.conversations}
          createConversation={this.props.createConversation}
          onConversationClicked={this.handleConvoClicked}
        />
      )
    } else if (this.state.showBotInfo) {
      return (
        <BotInfo
          botInfo={this.props.botInfo}
          config={this.props.config}
          currentConversation={this.props.currentConversation}
          toggleBotInfo={this.toggleBotInfo}
          onSendData={this.props.onSendData}
        />
      )
    } else {
      return this.renderConversation()
    }
  }

  render() {
    const fullscreen = this.props.fullscreen ? 'fullscreen' : null
    const classNames = classnames('bpw-layout', 'bpw-chat-container', {
      'bpw-layout-fullscreen': fullscreen,
      ['bpw-anim-' + this.props.transition]: true
    })

    const CustomComponent = getOverridedComponent(this.props.config.overrides, 'below_conversation')

    return (
      <span>
        <div className={classNames}>
          {this.renderHeader()}
          {this.renderBody()}
          {CustomComponent && <CustomComponent {...this.props} />}
        </div>
      </span>
    )
  }
}
