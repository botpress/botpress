import React from 'react'
import classnames from 'classnames'
import style from './Message.styl'
import { NavLink } from 'react-router-dom'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

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

  renderFinalDecision(finalDecision) {
    if (!finalDecision) {
      return 'N/A'
    }
    const { source, sourceDetails, decision } = finalDecision

    const QNA_PREFIX = '__qna__'
    const link =
      source === 'qna'
        ? `/modules/qna#search:${sourceDetails.replace(QNA_PREFIX, '')}`
        : `/modules/nlu/Intents#search:${sourceDetails}`

    return (
      <OverlayTrigger placement="top" overlay={<Tooltip id="none">{decision && decision.reason}</Tooltip>}>
        {source === 'decisionEngine' ? <span>{sourceDetails}</span> : <NavLink to={link}>{sourceDetails}</NavLink>}
      </OverlayTrigger>
    )
  }

  render() {
    const { duration, sent, result } = this.props.message

    const confidence = Number(_.get(result, 'decision.confidence', 0))
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
              <span className={style.title}>decision</span>
              <span className={style.value}>{this.renderFinalDecision(result.decision)}</span>
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
