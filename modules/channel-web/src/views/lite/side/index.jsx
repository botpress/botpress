import React from 'react'
import classnames from 'classnames'

import distanceInWordsToNow from 'date-fns/distance_in_words_to_now'

import Send from '../send'
import MessageList from '../messages'
import Input from '../input'

import BotAvatar from '../bot_avatar'
import BotInfo from '../bot-info'

import style from './style.scss'
import { getOverridedComponent } from '../messages/misc'

export default class Side extends React.Component {
  state = {
    focused: false,
    showConvos: false,
    showBotInfo: false
  }

  componentWillReceiveProps(nextProps) {
    let showConvos = this.state.showConvos
    if (!this.props.currentConversation && nextProps.currentConversation) {
      showConvos = false
    }

    const showBotInfo =
      this.props.currentConversation != nextProps.currentConversation &&
      nextProps.currentConversation &&
      nextProps.currentConversation.messages.length === 0

    if (showConvos != this.state.showConvos || showBotInfo != this.state.showBotInfo)
      this.setState({
        showConvos,
        showBotInfo
      })
  }

  handleFocus = value => {
    this.setState({
      focused: value
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

  renderAvatar() {
    let content = <BotAvatar foregroundColor={this.props.config.foregroundColor} />

    if (this.props.config && this.props.config.botAvatarUrl) {
      content = (
        <div className={style.picture} style={{ backgroundImage: 'url(' + this.props.config.botAvatarUrl + ')' }} />
      )
    }

    return (
      <div className={style.avatar} style={{ color: this.props.config.foregroundColor }}>
        {content}
      </div>
    )
  }

  renderUnreadCount() {
    return <span className={style.unread}>{this.props.unreadCount}</span>
  }

  renderTitle() {
    const title =
      this.props.currentConversation && !this.state.showConvos ? this.props.config.botConvoTitle : 'Conversations'

    const description = this.props.config.botConvoDescription
    const hasDescription = description && description.length > 0

    return (
      <div className={style.title}>
        <div className={style.name}>
          {title}
          {this.props.unreadCount > 0 ? this.renderUnreadCount() : null}
        </div>
        {hasDescription && <div className={style.status}>{description}</div>}
      </div>
    )
  }

  renderConvoButton() {
    if (!this.props.config.showConversationsButton) {
      return null
    }

    return (
      <span className={'bp-convos-btn ' + style.icon}>
        <i onClick={this.handleToggleShowConvos}>
          <svg height="15" viewBox="0 0 489 489" xmlns="http://www.w3.org/2000/svg">
            <g xmlns="http://www.w3.org/2000/svg">
              <path d="M52.7,134.75c29.1,0,52.7-23.7,52.7-52.7s-23.6-52.8-52.7-52.8S0,52.95,0,81.95S23.7,134.75,52.7,134.75z M52.7,53.75    c15.6,0,28.2,12.7,28.2,28.2s-12.7,28.2-28.2,28.2s-28.2-12.7-28.2-28.2S37.2,53.75,52.7,53.75z" />
              <path d="M52.7,297.55c29.1,0,52.7-23.7,52.7-52.7s-23.6-52.7-52.7-52.7S0,215.75,0,244.85S23.7,297.55,52.7,297.55z M52.7,216.65    c15.6,0,28.2,12.7,28.2,28.2s-12.7,28.2-28.2,28.2s-28.2-12.6-28.2-28.2S37.2,216.65,52.7,216.65z" />
              <path d="M52.7,460.45c29.1,0,52.7-23.7,52.7-52.7c0-29.1-23.7-52.7-52.7-52.7S0,378.75,0,407.75C0,436.75,23.7,460.45,52.7,460.45    z M52.7,379.45c15.6,0,28.2,12.7,28.2,28.2c0,15.6-12.7,28.2-28.2,28.2s-28.2-12.7-28.2-28.2C24.5,392.15,37.2,379.45,52.7,379.45    z" />
              <path d="M175.9,94.25h301.5c6.8,0,12.3-5.5,12.3-12.3s-5.5-12.3-12.3-12.3H175.9c-6.8,0-12.3,5.5-12.3,12.3    S169.1,94.25,175.9,94.25z" />
              <path d="M175.9,257.15h301.5c6.8,0,12.3-5.5,12.3-12.3s-5.5-12.3-12.3-12.3H175.9c-6.8,0-12.3,5.5-12.3,12.3    S169.1,257.15,175.9,257.15z" />
              <path d="M175.9,419.95h301.5c6.8,0,12.3-5.5,12.3-12.3s-5.5-12.3-12.3-12.3H175.9c-6.8,0-12.3,5.5-12.3,12.3    S169.1,419.95,175.9,419.95z" />
            </g>
          </svg>
        </i>
      </span>
    )
  }

  renderCloseButton() {
    if (!this.props.onClose) {
      return null
    }

    return (
      <span className={'bp-close-btn ' + style.icon}>
        <i onClick={this.props.onClose}>
          <svg height="15" viewBox="0 0 95 95" xmlns="http://www.w3.org/2000/svg">
            <g>
              <path
                xmlns="http://www.w3.org/2000/svg"
                d="M62.819,47.97l32.533-32.534c0.781-0.781,0.781-2.047,0-2.828L83.333,0.586C82.958,0.211,82.448,0,81.919,0   c-0.53,0-1.039,0.211-1.414,0.586L47.97,33.121L15.435,0.586c-0.75-0.75-2.078-0.75-2.828,0L0.587,12.608   c-0.781,0.781-0.781,2.047,0,2.828L33.121,47.97L0.587,80.504c-0.781,0.781-0.781,2.047,0,2.828l12.02,12.021   c0.375,0.375,0.884,0.586,1.414,0.586c0.53,0,1.039-0.211,1.414-0.586L47.97,62.818l32.535,32.535   c0.375,0.375,0.884,0.586,1.414,0.586c0.529,0,1.039-0.211,1.414-0.586l12.02-12.021c0.781-0.781,0.781-2.048,0-2.828L62.819,47.97   z"
              />
            </g>
          </svg>
        </i>
      </span>
    )
  }

  renderResetButton() {
    if (!this.props.config.enableReset) {
      return null
    }

    return (
      <span className={'bp-reset-btn ' + style.icon}>
        <i onClick={this.props.onResetSession}>
          <svg height="15" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <g>
              <path
                xmlns="http://www.w3.org/2000/svg"
                d="M288.502,32.502c-108.328,0-198.827,77.485-219.166,179.899l-42.482-53.107L0,180.784l68.769,85.961    c3.352,4.178,8.338,6.447,13.427,6.447c2.596,0,5.226-0.585,7.685-1.805l103.153-51.577l-15.387-30.757l-75.8,37.892    c14.063-90.5,92.27-160.059,186.655-160.059c104.271,0,189.114,84.843,189.114,189.114s-84.843,189.114-189.114,189.114v34.384    C411.735,479.498,512,379.233,512,256S411.735,32.502,288.502,32.502z"
              />
            </g>
          </svg>
        </i>
      </span>
    )
  }

  renderDownloadButton() {
    if (!this.props.config.enableTranscriptDownload) {
      return null
    }

    return (
      <span className={'bp-transcript-btn ' + style.downloadIcon}>
        <i onClick={this.props.downloadConversation}>
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            height="15"
            className={style.downloadSVG}
            viewBox="0 0 32 32"
          >
            <title>Download</title>
            <path d="M27.414 19.414l-10 10c-0.781 0.781-2.047 0.781-2.828 0l-10-10c-0.781-0.781-0.781-2.047 0-2.828s2.047-0.781 2.828 0l6.586 6.586v-19.172c0-1.105 0.895-2 2-2s2 0.895 2 2v19.172l6.586-6.586c0.39-0.39 0.902-0.586 1.414-0.586s1.024 0.195 1.414 0.586c0.781 0.781 0.781 2.047 0 2.828z" />
          </svg>
        </i>
      </span>
    )
  }

  renderBotInfoButton() {
    if (!this.state.showConvos) {
      // TODO display only if the props.showBotInfoPage is set to true
      return (
        <span className={style.icon}>
          <i onClick={this.toggleBotInfo}>
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="17" viewBox="0 0 437.6 437.6" space="preserve">
              <g>
                <path d="M194,142.8c0.8,1.6,1.6,3.2,2.4,4.4c0.8,1.2,2,2.4,2.8,3.6c1.2,1.2,2.4,2.4,4,3.6c1.2,0.8,2.8,2,4.8,2.4     c1.6,0.8,3.2,1.2,5.2,1.6c2,0.4,3.6,0.4,5.2,0.4c1.6,0,3.6,0,5.2-0.4c1.6-0.4,3.2-0.8,4.4-1.6h0.4c1.6-0.8,3.2-1.6,4.8-2.8     c1.2-0.8,2.4-2,3.6-3.2l0.4-0.4c1.2-1.2,2-2.4,2.8-3.6s1.6-2.4,2-4c0-0.4,0-0.4,0.4-0.8c0.8-1.6,1.2-3.6,1.6-5.2     c0.4-1.6,0.4-3.6,0.4-5.2s0-3.6-0.4-5.2c-0.4-1.6-0.8-3.2-1.6-5.2c-1.2-2.8-2.8-5.2-4.8-7.2c-0.4-0.4-0.4-0.4-0.8-0.8     c-1.2-1.2-2.4-2-4-3.2c-1.6-0.8-2.8-1.6-4.4-2.4c-1.6-0.8-3.2-1.2-4.8-1.6c-2-0.4-3.6-0.4-5.2-0.4c-1.6,0-3.6,0-5.2,0.4     c-1.6,0.4-3.2,0.8-4.8,1.6H208c-1.6,0.8-3.2,1.6-4.4,2.4c-1.6,1.2-2.8,2-4,3.2c-1.2,1.2-2.4,2.4-3.2,3.6     c-0.8,1.2-1.6,2.8-2.4,4.4c-0.8,1.6-1.2,3.2-1.6,4.8c-0.4,2-0.4,3.6-0.4,5.2c0,1.6,0,3.6,0.4,5.2     C192.8,139.6,193.6,141.2,194,142.8z" />
                <path d="M249.6,289.2h-9.2v-98c0-5.6-4.4-10.4-10.4-10.4h-42c-5.6,0-10.4,4.4-10.4,10.4v21.6c0,5.6,4.4,10.4,10.4,10.4h8.4v66.4     H188c-5.6,0-10.4,4.4-10.4,10.4v21.6c0,5.6,4.4,10.4,10.4,10.4h61.6c5.6,0,10.4-4.4,10.4-10.4V300     C260,294,255.2,289.2,249.6,289.2z" />
                <path d="M218.8,0C98,0,0,98,0,218.8s98,218.8,218.8,218.8s218.8-98,218.8-218.8S339.6,0,218.8,0z M218.8,408.8     c-104.8,0-190-85.2-190-190s85.2-190,190-190s190,85.2,190,190S323.6,408.8,218.8,408.8z" />
              </g>
            </svg>
          </i>
        </span>
      )
    }
  }

  renderHeader() {
    return (
      <div className={'bp-chat-header ' + style.header}>
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
          borderColor: this.state.focused ? this.props.config.foregroundColor : null
        }}
      >
        <div className={style['flex-column']}>
          <Input
            placeholder={'Reply to ' + name}
            send={this.props.onTextSend}
            change={this.props.onTextChanged}
            text={this.props.text}
            recallHistory={this.props.recallHistory}
            focused={this.handleFocus}
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
      botAvatarUrl: this.props.config && this.props.config.botAvatarUrl,
      showUserName: this.props.config && this.props.config.showUserName,
      showUserAvatar: this.props.config && this.props.config.showUserAvatar,
      onQuickReplySend: this.props.onQuickReplySend,
      onFormSend: this.props.onFormSend,
      onFileUploadSend: this.props.onFileUploadSend,
      onLoginPromptSend: this.props.onLoginPromptSend,
      onSendData: this.props.onSendData
    }

    return (
      <div className={'bp-chat-conversation ' + style.conversation}>
        <MessageList {...messagesProps} />
        <div className={'bp-chat-composer-container ' + style.bottom}>{this.renderComposer()}</div>
      </div>
    )
  }

  renderItemConvos = (convo, key) => {
    const title = convo.title || convo.message_author || 'Untitled Conversation'
    const date = distanceInWordsToNow(new Date(convo.message_sent_on || convo.created_on))
    const message = convo.message_text || '...'

    const onClick = () => {
      this.props.onSwitchConvo && this.props.onSwitchConvo(convo.id)

      this.setState({
        showConvos: false
      })
    }

    return (
      <div className={'bp-item ' + style.item} key={key} onClick={onClick}>
        <div className={style.left}>{this.renderAvatar()}</div>
        <div className={style.right}>
          <div className={'bp-title ' + style.title}>
            <div className={style.name}>{title}</div>
            <div className={style.date}>
              <span>{date}</span>
            </div>
          </div>
          <div className={'bp-preview ' + style.text}>{message}</div>
        </div>
      </div>
    )
  }

  renderListOfConvos() {
    const btnColor = this.props.config && this.props.config.textColorOnBackground
    return (
      <div className={'bp-list-convo ' + style.list}>
        {this.props.conversations.map(this.renderItemConvos)}
        <button
          className={'bp-new-convo-btn ' + style.addConvoBtn}
          style={{ color: btnColor, borderColor: btnColor }}
          onClick={this.props.createConversation}
        >
          +
        </button>
      </div>
    )
  }

  renderBody() {
    if (this.state.showConvos) {
      return this.renderListOfConvos()
    } else if (this.state.showBotInfo) {
      return (
        <BotInfo
          botInfo={this.props.botInfo}
          webchatConfig={this.props.config}
          dismissLabel={this.props.currentConversation.messages.length ? 'Back to Conversation' : null}
          onDismiss={this.toggleBotInfo}
        />
      )
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
