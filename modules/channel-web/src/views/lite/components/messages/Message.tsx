import classnames from 'classnames'
import pick from 'lodash/pick'

import React, { Component } from 'react'

import { Renderer } from '../../typings'
import * as Keyboard from '../Keyboard'

import { Carousel, FileMessage, LoginPrompt, Text } from './renderer'

class Message extends Component<Renderer.Message> {
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
    return this.render_text()
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

  render() {
    const type = this.props.payload && this.props.type || (this.props.payload && this.props.payload.type)
    const wrappedType = this.props.payload.wrapped && this.props.payload.wrapped.type
    const renderer = (this['render_' + type] || this.render_unsupported).bind(this)
    const wrappedClass = `bpw-bubble-${wrappedType}`

    const rendered = renderer()
    if (rendered === null) {
      return undefined
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

export default Message
