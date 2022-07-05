import ReactMessageRenderer from '@botpress/messaging-components'
import classnames from 'classnames'
import { inject, observer } from 'mobx-react'
import React, { Component } from 'react'
import { InjectedIntlProps, injectIntl } from 'react-intl'

import { RootStore, StoreDef } from '../../store'
import { Renderer } from '../../typings'
import { showContextMenu } from '../ContextMenu'

class Message extends Component<MessageProps> {
  state = {
    hasError: false,
    showMore: false
  }

  static getDerivedStateFromError(_error: Error) {
    console.log('Error rendering message', _error)
    return { hasError: true }
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

  render() {
    if (this.state.hasError) {
      return '* Cannot display message *'
    }

    const type = this.props.type || (this.props.payload && this.props.payload.type)
    const wrappedType = this.props.payload && this.props.payload.wrapped && this.props.payload.wrapped.type
    const wrappedClass = `bpw-bubble-${wrappedType}`
    const isEmulator = this.props.store.config.isEmulator

    const payload = { ...this.props.payload }
    if (type === 'session_reset') {
      payload.type = 'text'
      payload.text = this.props.store.intl.formatMessage({ id: 'store.resetSessionMessage' })
    }

    console.log('this.props.isLastOfGroup', this.props.isLastOfGroup)
    console.log('this.props.isLastGroup', this.props.isLastGroup)
    const rendered = (
      <ReactMessageRenderer
        key={this.props.messageId}
        content={payload}
        config={{
          bp: this.props.store.bp,
          messageId: this.props.messageId,
          noMessageBubble: this.props.noBubble,
          isLastOfGroup: this.props.isLastOfGroup,
          isLastGroup: this.props.isLastGroup,
          isBotMessage: this.props.isBotMessage,
          sentOn: this.props.sentOn,
          onSendData: this.props.onSendData!,
          onFileUpload: this.props.onFileUpload!,
          store: this.props.store,
          onAudioEnded: this.props.onAudioEnded,
          shouldPlay: this.props.shouldPlay,
          intl: this.props.store.intl as any,
          escapeHTML: true,
          showTimestamp: this.props.store.config.showTimestamp
        }}
      />
    )

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
