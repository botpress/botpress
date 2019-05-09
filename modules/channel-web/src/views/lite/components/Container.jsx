import React from 'react'
import classnames from 'classnames'

import * as Keyboard from './Keyboard'
import ConversationList from './ConversationList'
import Composer from './Composer'
import Header from './Header'
import BotInfo from './common/BotInfo'
import MessageList from './messages/MessageList'

import { getOverridedComponent } from '../utils'
import { injectIntl } from 'react-intl'

class Container extends React.Component {
  state = {
    currentFocus: 'input',
    showConvos: false,
    showBotInfo: false
  }

  componentDidMount() {
    if (!this.props.currentConversation && this.props.botInfo.showBotInfoPage) {
      this.setState({ showBotInfo: true })
    }
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.currentConversation && this.props.currentConversation) {
      this.setState({ showConvos: false })
    }
  }

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
        botName={this.props.botName}
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
    const Component = getOverridedComponent(this.props.config.overrides, 'composer')

    if (Component) {
      return (
        <Keyboard.Default>
          <Component original={{ Composer }} name={this.props.botName} {...this.props} />
        </Keyboard.Default>
      )
    }

    return (
      <Keyboard.Default>
        <Composer
          placeholder={this.props.intl.formatMessage({ id: 'composer.placeholder' }, { name: this.props.botName })}
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
      botName: this.props.botName,
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

export default injectIntl(Container)
