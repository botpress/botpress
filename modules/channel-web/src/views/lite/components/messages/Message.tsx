import classnames from 'classnames'
import pick from 'lodash/pick'

import React, { Component } from 'react'
import { inject } from 'mobx-react'
import { RootStore, StoreDef } from '../../store'

import { Renderer } from '../../typings'
import * as Keyboard from '../Keyboard'

import { Carousel, FileMessage, LoginPrompt, Text } from './renderer'

class Message extends Component<MessageProps> {
  state = {
    hasError: false
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  render_text(textMessage?: string) {
    const { text, markdown } = this.props.payload

    if (!textMessage && !text) {
      return null
    }
    return <Text markdown={markdown} text={textMessage || text} />
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
    return <Carousel onSendData={this.props.onSendData} carousel={this.props.payload} />
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

  render_file() {
    return <FileMessage file={this.props.payload} />
  }

  render_custom() {
    const { module = undefined, component = undefined, wrapped = undefined } = this.props.payload || {}
    if (!module || !component) {
      return this.render_unsupported()
    }

    const InjectedModuleView = this.props.store.bp.getModuleInjector()

    const messageDataProps = { ...this.props.payload }
    delete messageDataProps.module
    delete messageDataProps.component

    const sanitizedProps = pick(this.props, [
      'incomingEventId',
      'isLastGroup',
      'isLastOfGroup',
      'isBotMessage',
      'onSendData',
      'onFileUpload',
      'sentOn',
      'store',
      'className'
    ])

    const props = {
      ...sanitizedProps,
      ...messageDataProps,
      keyboard: Keyboard,
      children: wrapped && <Message {...sanitizedProps} keyboard={Keyboard} noBubble={true} payload={wrapped} />
    }

    return <InjectedModuleView moduleName={module} componentName={component} lite={true} extraProps={props} />
  }

  render_session_reset() {
    return this.render_text(this.props.intl.formatMessage({ id: 'store.resetSessionMessage' }))
  }

  render_visit() {
    return null
  }

  render_postback() {
    return this.render_text()
  }

  render_unsupported() {
    return '*Unsupported message type*'
  }

  handleContextMenu = e => {
    const showContextMenu = window.botpress.extensions && window.botpress.extensions.showContextMenu
    if (showContextMenu) {
      showContextMenu(e, this.props)
    }
  }

  render() {
    if (this.state.hasError) {
      return '* Cannot display message *'
    }

    const type = this.props.type || (this.props.payload && this.props.payload.type)
    const wrappedType = this.props.payload && this.props.payload.wrapped && this.props.payload.wrapped.type
    const renderer = (this['render_' + type] || this.render_unsupported).bind(this)
    const wrappedClass = `bpw-bubble-${wrappedType}`

    const rendered = renderer()
    if (rendered === null) {
      return null
    }

    const additionalStyle = (this.props.payload && this.props.payload['web-style']) || {}

    if (this.props.noBubble) {
      return (
        <div className={classnames(this.props.className, wrappedClass)} style={additionalStyle}>
          {rendered}
        </div>
      )
    }

    return (
      <div
        onContextMenu={type !== 'session_reset' ? this.handleContextMenu : () => {}}
        className={classnames(this.props.className, wrappedClass, 'bpw-chat-bubble', 'bpw-bubble-' + type, {
          'bpw-bubble-highlight': this.props.isHighlighted
        })}
        style={additionalStyle}
      >
        {rendered}
      </div>
    )
  }
}

export default inject(({ store }: { store: RootStore }) => ({
  intl: store.intl
}))(Message)

type MessageProps = Renderer.Message & Pick<StoreDef, 'intl'>
