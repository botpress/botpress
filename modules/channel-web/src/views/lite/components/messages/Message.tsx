import classnames from 'classnames'
import pick from 'lodash/pick'
import { inject, observer } from 'mobx-react'
import React, { Component } from 'react'
import { InjectedIntlProps, injectIntl } from 'react-intl'

import { RootStore, StoreDef } from '../../store'
import { Renderer } from '../../typings'
import { showContextMenu } from '../ContextMenu'
import * as Keyboard from '../Keyboard'

import { Carousel, FileMessage, LoginPrompt, Text, VoiceMessage } from './renderer'
import { Dropdown } from './renderer/Dropdown'

class Message extends Component<MessageProps> {
  state = {
    hasError: false,
    showMore: false
  }

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true }
  }

  render_text(textMessage?: string) {
    const { text, markdown } = this.props.payload
    const message = textMessage || text

    return (
      <Text
        markdown={markdown}
        text={message}
        intl={this.props.intl}
        maxLength={this.props.payload.trimLength}
        escapeHTML={this.props.store.escapeHTML}
        isBotMessage={this.props.isBotMessage}
      />
    )
  }

  render_quick_reply() {
    return this.render_text()
  }

  render_login_prompt() {
    return (
      <LoginPrompt
        isLastMessage={this.props.isLastGroup && this.props.isLastOfGroup}
        isBotMessage={this.props.isBotMessage}
        onSendData={this.props.onSendData}
      />
    )
  }

  render_carousel() {
    return (
      <Carousel
        onSendData={this.props.onSendData}
        carousel={this.props.payload}
        escapeHTML={this.props.store.escapeHTML}
        isBotMessage={this.props.isBotMessage}
        intl={this.props.intl}
      />
    )
  }

  render_typing() {
    return (
      <div className={'bpw-typing-group'}>
        <div className={'bpw-typing-bubble'} />
        <div className={'bpw-typing-bubble'} />
        <div className={'bpw-typing-bubble'} />
      </div>
    )
  }

  render_audio() {
    return <FileMessage file={this.props.payload} escapeTextHTML={this.props.store.escapeHTML} />
  }

  render_video() {
    return <FileMessage file={this.props.payload} escapeTextHTML={this.props.store.escapeHTML} />
  }

  render_image() {
    return <FileMessage file={this.props.payload} escapeTextHTML={this.props.store.escapeHTML} />
  }

  render_file() {
    return <FileMessage file={this.props.payload} escapeTextHTML={this.props.store.escapeHTML} />
  }

  render_voice() {
    return (
      <VoiceMessage
        file={this.props.payload}
        shouldPlay={this.props.shouldPlay}
        onAudioEnded={this.props.onAudioEnded}
      />
    )
  }

  render_custom() {
    const { module = undefined, component = undefined, wrapped = undefined } = this.props.payload || {}
    if (!module || !component) {
      return this.render_unsupported()
    }

    // TODO: Remove eventually, it's for backward compatibility
    if (module === 'extensions' && component === 'Dropdown') {
      return this.render_dropdown()
    }

    const InjectedModuleView = this.props.store.bp.getModuleInjector()

    const messageDataProps = { ...this.props.payload }
    delete messageDataProps.module
    delete messageDataProps.component

    const sanitizedProps = pick(this.props, [
      'messageId',
      'isLastGroup',
      'isLastOfGroup',
      'isBotMessage',
      'onSendData',
      'onFileUpload',
      'sentOn',
      'store',
      'className',
      'intl'
    ])

    const props = {
      ...sanitizedProps,
      ...messageDataProps,
      keyboard: Keyboard,
      children: wrapped && <Message {...sanitizedProps} keyboard={Keyboard} noBubble payload={wrapped} />
    }

    return <InjectedModuleView moduleName={module} componentName={component} lite extraProps={props} />
  }

  render_session_reset() {
    return this.render_text(this.props.store.intl.formatMessage({ id: 'store.resetSessionMessage' }))
  }

  render_visit() {
    return null
  }

  render_unsupported() {
    return '*Unsupported message type*'
  }

  render_dropdown() {
    return <Dropdown {...this.props} {...this.props.payload} escapeHTML={this.props.store.escapeHTML}></Dropdown>
  }

  handleContextMenu = e => {
    showContextMenu(e, this.props)
  }

  renderTimestamp() {
    return (
      <span className="bpw-message-timestamp">
        {this.props.store.intl.formatTime(new Date(this.props.sentOn), { hour: 'numeric', minute: 'numeric' })}
      </span>
    )
  }

  async onMessageClicked() {
    await this.props.store.loadEventInDebugger(this.props.messageId, true)
  }

  componentDidMount() {
    this.props.isLastGroup &&
      this.props.isLastOfGroup &&
      this.props.store.composer.setLocked(this.props.payload.disableFreeText)
  }

  render() {
    if (this.state.hasError) {
      return '* Cannot display message *'
    }

    const type = this.props.type || (this.props.payload && this.props.payload.type)
    const wrappedType = this.props.payload && this.props.payload.wrapped && this.props.payload.wrapped.type
    const renderer = (this[`render_${type}`] || this.render_unsupported).bind(this)
    const wrappedClass = `bpw-bubble-${wrappedType}`
    const isEmulator = this.props.store.config.isEmulator

    const rendered = renderer()
    if (rendered === null) {
      return null
    }

    const additionalStyle = (this.props.payload && this.props.payload['web-style']) || {}

    if (this.props.noBubble || this.props.payload?.wrapped?.noBubble) {
      return (
        <div className={classnames(this.props.className, wrappedClass)} style={additionalStyle}>
          {rendered}
        </div>
      )
    }

    return (
      <div
        className={classnames(this.props.className, wrappedClass, 'bpw-chat-bubble', `bpw-bubble-${type}`, {
          'bpw-bubble-highlight': this.props.isHighlighted,
          'bpw-msg-hovering': isEmulator
        })}
        data-from={this.props.fromLabel}
        onClick={() => this.onMessageClicked()}
        tabIndex={-1}
        style={additionalStyle}
      >
        <div
          tabIndex={-1}
          className="bpw-chat-bubble-content"
          onContextMenu={type !== 'session_reset' ? this.handleContextMenu : () => {}}
        >
          <span className="sr-only">
            {this.props.store.intl.formatMessage({
              id: this.props.isBotMessage ? 'message.botSaid' : 'message.iSaid',
              defaultMessage: this.props.isBotMessage ? 'Virtual assistant said : ' : 'I said : '
            })}
          </span>
          {rendered}
          {this.props.store.config.showTimestamp && this.renderTimestamp()}
        </div>
        {this.props.inlineFeedback}
      </div>
    )
  }
}

export default inject(({ store }: { store: RootStore }) => ({
  intl: store.intl
}))(injectIntl(observer(Message)))

type MessageProps = Renderer.Message & InjectedIntlProps & Pick<StoreDef, 'intl'>
