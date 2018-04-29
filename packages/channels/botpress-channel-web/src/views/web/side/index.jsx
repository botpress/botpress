import React from 'react'
import ReactDOM from 'react-dom'
import classnames from 'classnames'
// import { Picker } from 'emoji-mart'

import distanceInWordsToNow from 'date-fns/distance_in_words_to_now'

import Send from '../send'
import MessageList from '../messages'
import Input from '../input'

import BotAvatar from '../bot_avatar'

import style from './style.scss'
// require('emoji-mart/css/emoji-mart.css')

export default class Side extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      focused: false,
      showEmoji: false,
      showConvos: false
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!this.props.currentConversation && nextProps.currentConversation) {
      this.setState({ showConvos: false })
    }
  }

  handleFocus(value) {
    this.setState({
      focused: value
    })
  }

  handleEmojiClicked() {
    this.setState({
      showEmoji: !this.state.showEmoji
    })
  }

  handleToggleShowConvos() {
    this.setState({
      showConvos: !this.state.showConvos
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
    return (
      <span className={style.icon}>
        <i onClick={::this.handleToggleShowConvos}>
          <svg width="24" height="17" viewBox="0 0 489 489" xmlns="http://www.w3.org/2000/svg">
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
      <span className={style.icon}>
        <i onClick={this.props.onClose}>
          <svg width="17" height="17" viewBox="0 0 95 95" xmlns="http://www.w3.org/2000/svg">
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
      <span className={style.icon}>
        <i onClick={this.props.onResetSession}>
          <svg width="17" height="17" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
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

  renderHeader() {
    const status = (
      <div className={style.status}>
        <svg viewBox="0 0 10 10">
          <ellipse cx="50%" cy="50%" rx="50%" ry="50%" />
        </svg>
        <span>always online</span>
      </div>
    )

    return (
      <div className={style.header}>
        <div className={style.left}>
          <div className={style.line}>
            {this.renderAvatar()}
            {this.renderTitle()}
          </div>
        </div>
        {this.renderResetButton()}
        {this.renderConvoButton()}
        {this.renderCloseButton()}
      </div>
    )
  }

  renderAttachmentButton() {
    return null // Temporary removed this feature (not implemented yet)

    return (
      <li>
        <a>
          <i>
            <svg width="18" height="17" viewBox="0 0 18 17" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M8.455 16.5c-.19 0-.378-.076-.522-.226-.29-.303-.29-.792 0-1.093l7.66-8.013c.57-.597.885-1.392.885-2.236 0-.844-.315-1.638-.886-2.235-1.18-1.233-3.097-1.232-4.275 0L2.433 11.99c-.5.525-.742 1.03-.715 1.502.026.46.303.815.467.985.275.29.573.41.908.364.42-.054.903-.356 1.398-.874l6.973-7.295c.288-.3.755-.3 1.043 0 .29.303.29.793 0 1.093l-6.97 7.296c-.74.773-1.5 1.215-2.26 1.314-.797.104-1.535-.175-2.135-.804-.537-.562-.856-1.267-.896-1.985-.054-.933.332-1.836 1.144-2.686l8.885-9.297c1.754-1.836 4.61-1.836 6.363 0 .85.888 1.318 2.07 1.318 3.328s-.468 2.44-1.318 3.33l-7.66 8.014c-.143.15-.332.226-.52.226z"
                fill-rule="evenodd"
              />
            </svg>
          </i>
        </a>
      </li>
    )
  }

  renderEmojiButton() {
    return null // Temporary removed this feature (emoji-mart lib is too big)

    return (
      <li>
        <a>
          <i onClick={::this.handleEmojiClicked}>
            <svg preserveAspectRatio="xMidYMid" width="18" height="18" viewBox="0 0 24 24">
              <path d="M12 24C5.38 24 0 18.62 0 12S5.38 0 12 0s12 5.38 12 12-5.38 12-12 12zm0-22C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-2.9 0-5.56-1.75-6.9-4.57-.24-.5-.03-1.1.47-1.33.5-.24 1.1-.03 1.33.47C7.9 16.67 9.86 18 12 18c2.15 0 4.1-1.3 5.1-3.43.23-.5.83-.7 1.33-.47.5.23.7.83.47 1.33C17.58 18.25 14.93 20 12 20zm4-8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-8 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
            </svg>
          </i>
        </a>
      </li>
    )
  }

  renderComposer() {
    const name = this.props.config.botName || 'Bot'

    return (
      <div
        className={style.composer}
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
            focused={::this.handleFocus}
            config={this.props.config}
          />
          <div className={style.line}>
            <ul className={style.elements}>
              {this.renderAttachmentButton()}
              {this.renderEmojiButton()}
            </ul>
            <Send send={this.props.onTextSend} text={this.props.text} config={this.props.config} />
          </div>
          {this.renderEmojiPicker()}
        </div>
      </div>
    )
  }

  renderEmojiPicker() {
    if (!this.state.showEmoji) {
      return null
    }

    return null // Temporary removed this feature (emoji-mart is too big)

    // return <div className={style.emoji}>
    //     <div className={style.inside}>
    //       <Picker
    //         onClick={this.props.addEmojiToText}
    //         set='emojione'
    //         emojiSize={18}
    //         perLine={10}
    //         color={this.props.config.foregroundColor}/>
    //     </div>
    //   </div>
  }

  renderConversation() {
    const messagesProps = {
      typingUntil: this.props.currentConversation && this.props.currentConversation.typingUntil,
      messages: this.props.currentConversation && this.props.currentConversation.messages,
      fgColor: this.props.config && this.props.config.foregroundColor,
      textColor: this.props.config && this.props.config.textColorOnForeground,
      avatarUrl: this.props.config && this.props.config.botAvatarUrl,
      onQuickReplySend: this.props.onQuickReplySend,
      onFormSend: this.props.onFormSend,
      onFileUploadSend: this.props.onFileUploadSend,
      onLoginPromptSend: this.props.onLoginPromptSend,
      onSendData: this.props.onSendData
    }

    return (
      <div className={style.conversation}>
        <MessageList {...messagesProps} />
        <div className={style.bottom}>{this.renderComposer()}</div>
      </div>
    )
  }

  renderItemConvos(convo, key) {
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
      <div className={style.item} key={key} onClick={onClick}>
        <div className={style.left}>{this.renderAvatar()}</div>
        <div className={style.right}>
          <div className={style.title}>
            <div className={style.name}>{title}</div>
            <div className={style.date}>
              <span>{date}</span>
            </div>
          </div>
          <div className={style.text}>{message}</div>
        </div>
      </div>
    )
  }

  renderListOfConvos() {
    return <div className={style.list}>{this.props.conversations.map(::this.renderItemConvos)}</div>
  }

  render() {
    const fullscreen = this.props.fullscreen ? 'fullscreen' : null
    const classNames = classnames(style.internal, style[fullscreen], style[this.props.transition])

    return (
      <span className={style.external}>
        <div
          className={classNames}
          style={{
            backgroundColor: this.props.config.backgroundColor,
            color: this.props.config.textColorOnBackgound
          }}
        >
          {this.renderHeader()}
          {this.state.showConvos ? this.renderListOfConvos() : this.renderConversation()}
        </div>
      </span>
    )
  }
}
