import React, { Component } from 'react'
import { FileMessage, Carousel, LoginPrompt, Text } from './renderer'
import classnames from 'classnames'
import * as Keyboard from '../Keyboard'

class Message extends Component {
  render_text(textMessage) {
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
    const { module, component, wrapped } = this.props.payload || {}
    if (!module || !component) {
      return this.render_unsupported()
    }

    const InjectedModuleView = this.props.bp.getModuleInjector()

    const messageDataProps = { ...this.props.payload }
    delete messageDataProps.module
    delete messageDataProps.component

    const props = {
      ..._.pick(this.props, ['isLastGroup', 'isLastOfGroup', 'onSendData', 'onFileUpload', 'sentOn']),
      ...messageDataProps,
      keyboard: Keyboard,
      children: wrapped && <Message bp={this.props.bp} keyboard={Keyboard} noBubble={true} payload={wrapped} />
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
    const type = this.props.type || (this.props.payload && this.props.payload.type)
    const renderer = (this['render_' + type] || this.render_unsupported).bind(this)
    const rendered = renderer()
    if (rendered === null) {
      return null
    }

    const additionalStyle = (this.props.payload && this.props.payload['web-style']) || {}

    if (this.props.noBubble) {
      return rendered
    }

    return (
      <div className={classnames('bpw-chat-bubble', 'bpw-bubble-' + type)} style={additionalStyle}>
        {rendered}
      </div>
    )
  }
}

export default Message
