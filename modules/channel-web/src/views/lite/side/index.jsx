import React from 'react'
import classnames from 'classnames'

import Send from '../send'
import MessageList from '../messages'
import Input from '../input'
import BotInfo from '../bot-info'
import Header from './header'
import ConversationList from './ConversationList'
import style from './style.scss'
import { getOverridedComponent } from '../messages/misc'

export default class Side extends React.Component {
  state = {
    headerFocused: false,
    inputFocused: false,
    convoFocused: false,
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

    if (showConvos != this.state.showConvos || showBotInfo != this.state.showBotInfo)
      this.setState({
        showConvos,
        showBotInfo
      })
  }

  isConvoStarted = conversation => {
    return conversation && !!conversation.messages.length
  }

  handleInputFocus = value => {
    this.setState({
      inputFocused: value
    })
  }

  handleConvoFocus = value => {
    this.setState({
      convoFocused: value
    })
  }

  handleHeaderFocus = value => {
    this.setState({
      headerFocused: value
    })
  }

  handleToggleShowConvos = () => {
    this.setState({
      showConvos: !this.state.showConvos
    })
  }

  toggleBotInfo = () => {
    this.setState({
      showBotInfo: !this.state.showBotInfo
    })
  }

  handleConvoClicked = convoId => {
    this.props.onSwitchConvo && this.props.onSwitchConvo(convoId)
    this.handleToggleShowConvos()
  }

  renderHeader() {
    const focusPrevious = () => {
      if (this.state.showBotInfo) {
        console.log('focus on convos')
      } else if (this.state.showConvos) {
        console.log('focus on convos')
      } else {
        this.handleInputFocus(true)
      }
    }

    const focusNext = () => {
      if (this.state.showBotInfo) {
        console.log('focus on convos')
      } else if (this.state.showConvos) {
        console.log('focus on convos')
      } else {
        this.handleConvoFocus(true)
      }
    }

    return (
      <Header
        focused={this.state.headerFocused}
        showConvos={this.state.showConvos}
        botInfo={this.props.botInfo}
        config={this.props.config}
        currentConversation={this.props.currentConversation}
        unreadCount={this.props.unreadCount}
        currentView={this.state.currentView}
        onResetClicked={this.props.onResetSession}
        onDownloadClicked={this.props.downloadConversation}
        onCloseClicked={this.props.onClose}
        onListClicked={this.handleToggleShowConvos}
        onInfoClicked={this.toggleBotInfo}
        focusNext={focusNext}
        focusPrevious={focusPrevious}
        onBlur={this.handleHeaderFocus.bind(this, false)}
      />
    )
  }

  renderComposer() {
    const name = this.props.config.botName || 'Bot'
    const Component = getOverridedComponent(this.props.config.overrides, 'composer')

    if (Component) {
      return <Component original={{ Input, style }} name={name} {...this.props} />
    }

    return (
      <div
        className={'bp-chat-composer ' + style.composer}
        style={{
          borderColor: this.state.inputFocused ? this.props.config.foregroundColor : null
        }}
      >
        <div className={style['flex-column']}>
          <Input
            placeholder={'Reply to ' + name}
            send={this.props.onTextSend}
            change={this.props.onTextChanged}
            text={this.props.text}
            recallHistory={this.props.recallHistory}
            focused={this.state.inputFocused}
            onFocus={this.handleInputFocus.bind(this, true)}
            onBlur={this.handleInputFocus.bind(this, false)}
            focusNext={this.handleHeaderFocus.bind(this, true)}
            focusPrevious={this.handleConvoFocus.bind(this, true)}
            config={this.props.config}
          />
          <div className={style.line}>
            <Send send={this.props.onTextSend} text={this.props.text} config={this.props.config} />
          </div>
        </div>
      </div>
    )
  }

  renderConversation() {
    const messagesProps = {
      bp: this.props.bp,
      typingUntil: this.props.currentConversation && this.props.currentConversation.typingUntil,
      messages: this.props.currentConversation && this.props.currentConversation.messages,
      fgColor: this.props.config && this.props.config.foregroundColor,
      textColor: this.props.config && this.props.config.textColorOnForeground,
      botName: this.props.botInfo.name || this.props.config.botName,
      botAvatarUrl: (this.props.botInfo.details && this.props.botInfo.details.avatarUrl) || this.props.config.avatarUrl,
      showUserName: this.props.config && this.props.config.showUserName,
      showUserAvatar: this.props.config && this.props.config.showUserAvatar,
      onQuickReplySend: this.props.onQuickReplySend,
      onFormSend: this.props.onFormSend,
      onFileUploadSend: this.props.onFileUploadSend,
      onLoginPromptSend: this.props.onLoginPromptSend,
      onSendData: this.props.onSendData,
      focused: this.state.convoFocused,
      onBlur: this.handleConvoFocus.bind(this, false),
      focusNext: this.handleInputFocus.bind(this, true),
      focusPrevious: this.handleHeaderFocus.bind(this, true)
    }

    return (
      <div className={'bp-chat-conversation ' + style.conversation}>
        <MessageList {...messagesProps} />
        <div className={'bp-chat-composer-container ' + style.bottom}>{this.renderComposer()}</div>
      </div>
    )
  }

  renderBotInfoPage = () => {
    // TODO move this logic in botInfo component
    const isConvoStarted = this.props.currentConversation && !!this.props.currentConversation.messages.length
    const onDismiss = isConvoStarted ? this.toggleBotInfo : this.props.startConversation.bind(this, this.toggleBotInfo)
    return (
      <BotInfo
        botInfo={this.props.botInfo}
        webchatConfig={this.props.config}
        dismissLabel={isConvoStarted ? 'Back to Conversation' : 'Start Conversation'}
        onDismiss={onDismiss}
      />
    )
  }

  renderBody() {
    if (this.state.showConvos) {
      return (
        <ConversationList
          conversations={this.props.conversations}
          createConversation={this.props.createConversation}
          onConversationClicked={this.handleConvoClicked}
        />
      )
    } else if (this.state.showBotInfo) {
      return this.renderBotInfoPage()
    } else {
      return this.renderConversation()
    }
  }

  render() {
    const fullscreen = this.props.fullscreen ? 'fullscreen' : null
    const classNames = classnames('bp-chat-inner', style.internal, style[fullscreen], style[this.props.transition])

    const CustomComponent = getOverridedComponent(this.props.config.overrides, 'below_conversation')

    return (
      <span className={'bp-chat-container ' + style.external}>
        <div
          className={classNames}
          style={{
            backgroundColor: this.props.config.backgroundColor,
            color: this.props.config.textColorOnBackgound
          }}
        >
          {this.renderHeader()}
          {this.renderBody()}
          {CustomComponent && <CustomComponent {...this.props} />}
        </div>
      </span>
    )
  }
}
