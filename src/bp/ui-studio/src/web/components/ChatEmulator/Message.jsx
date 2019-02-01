import React from 'react'
import classnames from 'classnames'
import style from './Message.styl'
import { NavLink } from 'react-router-dom'
import { Glyphicon } from 'react-bootstrap'

export default class Message extends React.Component {
  renderBotMessage(message, index) {
    if (message.type === 'typing') {
      return <span className={classnames(style.message, style.typing)}>...typing...</span>
    }

    if (message.type === 'text') {
      return <span className={classnames(style.message, style.text)}>{message.text}</span>
    }

    return <span className={classnames(style.message, style.other)}>{message.type} (can't render)</span>
  }

  renderIntentLink(intent) {
    if (intent === 'N/A') {
      return intent
    }

    const QNA_PREFIX = '__qna__'
    const link = intent.includes(QNA_PREFIX)
      ? `/modules/qna#search:${intent.replace(QNA_PREFIX, '')}`
      : `/modules/nlu/intents#search:${intent}`

    return <NavLink to={link}>{intent}</NavLink>
  }

  render() {
    const { duration, sent, result } = this.props.message

    const intent = _.get(result, 'nlu.intent.name', 'N/A')
    const confidence = Number(_.get(result, 'nlu.intent.confidence', 0))
    const confidenceFormatted = (confidence * 100).toFixed(1)

    let responses = result.responses
    if (this.props.hideTyping) {
      responses = responses.filter(response => response.type !== 'typing')
    }

    return (
      <div
        onFocus={this.props.onFocus}
        tabIndex={this.props.tabIndex}
        className={classnames(style.row, { [style.selected]: this.props.selected })}
      >
        <div className={style.message}>
          <div className={style.header}>
            <div className={style.intent}>
              <span className={style.title}>intent</span>
              <span className={style.value}>{this.renderIntentLink(intent)}</span>
              <span className={style.confidence}>{confidenceFormatted}%</span>
            </div>
            <div className={style.duration}>
              {duration}
              ms
            </div>
          </div>
          <div className={style.content}>
            <span className={style.from}>User</span>
            <span className={style.message}>{sent}</span>
          </div>
          <div className={style.response}>
            {responses.map((msg, idx) => {
              return (
                <div className={style.content} key={`b-res-${idx}`}>
                  <span className={classnames(style.from, { [style.invisible]: idx > 0 })}>Bot</span>
                  {this.renderBotMessage(msg, idx)}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
}
