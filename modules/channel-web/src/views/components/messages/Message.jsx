import React, { Component } from 'react'
import { FileMessage, Carousel, LoginPrompt, Text } from '../../components'
import classnames from 'classnames'
import style from '../style.scss'

export class Message extends Component {
  render_text() {
    const { text, markdown, message_raw, message_text } = this.props.data

    return <Text markdown={markdown || (message_raw && message_raw.markdown)} text={text || message_text} />
  }

  render_form() {
    return <p>{this.props.data.message_text}</p>
  }

  render_quick_reply() {
    return <p>{this.props.data.message_text}</p>
  }

  render_login_prompt() {
    const isLastMessage = this.props.isLastOfGroup && this.props.isLastGroup
    const isBotMessage = !this.props.data.userId

    return <LoginPrompt isLastMessage={isLastMessage} isBotMessage={isBotMessage} onSendData={this.props.onSendData} />
  }

  render_carousel() {
    return <Carousel onSendData={this.props.onSendData} carousel={this.props.data.message_raw} />
  }

  render_typing() {
    const bubble = () => <div className={style.typingBubble} style={{ backgroundColor: '#000000' }} />

    return (
      <div className={'bp-typing-indicator ' + style.typingGroup}>
        {bubble()}
        {bubble()}
        {bubble()}
      </div>
    )
  }

  render_file() {
    return <FileMessage file={this.props.data.message_data} />
  }

  render_custom() {
    const { module, component } = this.props.data.message_data || {}
    if (!module || !component) {
      return this.render_unsupported()
    }

    const InjectedModuleView = this.props.bp.getModuleInjector()

    const messageDataProps = { ...this.props.data.message_data }
    delete messageDataProps.module
    delete messageDataProps.component

    const props = {
      ..._.pick(this.props, ['isLastGroup', 'isLastOfGroup', 'onSendData']),
      ...messageDataProps
    }

    return <InjectedModuleView moduleName={module} componentName={component} lite={true} extraProps={props} />
  }

  render_session_reset() {
    return <p>{this.props.data.message_text}</p>
  }

  render_visit() {
    return null
  }

  render_postback() {
    return this.props.data.message_data.text || null
  }

  render_unsupported() {
    return <p>*Unsupported message type*</p>
  }

  render() {
    const renderer = (this['render_' + this.props.data.message_type] || this.render_unsupported).bind(this)
    const rendered = renderer()
    if (rendered === null) {
      return null
    }

    const additionalStyle = (this.props.data.message_raw && this.props.data.message_raw['web-style']) || {}

    return (
      <div
        className={classnames('bpw-chat-bubble', 'bpw-bubble-' + this.props.data.message_type)}
        style={additionalStyle}
      >
        {rendered}
      </div>
    )
  }
}
