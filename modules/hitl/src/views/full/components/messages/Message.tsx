import ReactMessageRenderer, { defaultMessageConfig } from '@botpress/messaging-components'
import classnames from 'classnames'
import _ from 'lodash'
import moment from 'moment'
import React from 'react'

import { Message as HitlMessage } from '../../../../backend/typings'
import SVGIcon from '../SVGIcon'

export default class Message extends React.Component<{ message: HitlMessage }> {
  renderContent() {
    let { raw_message: payload } = this.props.message
    const { ts, source } = this.props.message

    if (!payload.type) {
      payload = { ...payload, type: 'text' }
    }

    return (
      <ReactMessageRenderer
        content={payload}
        config={{
          ...defaultMessageConfig,
          isBotMessage: source !== 'user',
          isLastGroup: false,
          isLastOfGroup: false,
          sentOn: ts
        }}
      />
    )
  }

  renderMessage() {
    const { ts, direction, type, source } = this.props.message
    const date = moment(ts).format('MMMM Do YYYY, h:mm a')

    let messageFrom = 'bot'
    if (direction === 'in') {
      // TODO: Visit and session reset are currently unsupported by @botpress/messaging-components
      if (type === 'visit') {
        return (
          <div className={classnames('bph-message', 'bph-from-system')}>
            <p>User visit: {date}</p>
          </div>
        )
      } else if (type === 'session_reset') {
        return (
          <div className={classnames('bph-message', 'bph-from-system')}>
            <p>Reset the conversation</p>
          </div>
        )
      }
      messageFrom = 'user'
    } else if (source === 'agent') {
      messageFrom = 'agent'
    }

    const avatar = (
      <div className="bph-message-avatar">
        {<SVGIcon name={messageFrom} width="50" fill="#FFF" />}
        <time>{moment(ts).format('LT')}</time>
      </div>
    )

    return (
      <div
        className={classnames('bph-message', {
          ['bph-from-agent']: messageFrom === 'agent',
          ['bph-from-bot']: messageFrom === 'bot'
        })}
      >
        {messageFrom === 'user' && avatar}
        <div className="bph-message-container">
          <div className={classnames('bph-chat-bubble', { ['card']: type === 'card' })}>{this.renderContent()}</div>
        </div>
        {messageFrom !== 'user' && avatar}
      </div>
    )
  }

  render() {
    return this.renderMessage()
  }
}
