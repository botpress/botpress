import React from 'react'

import { updater } from '.'
import style from './style.scss'

export class Wrapper extends React.Component<WrapperProps> {
  highlightGroupedMessages = eventId => {
    const style = { border: '2px solid #0000ff' }
    const updatedMessages = this.props.store.currentConversation.messages.map(msg => {
      delete msg.payload['web-style']
      return {
        ...msg,
        payload: { ...msg.payload, ...(msg.incomingEventId === eventId && { ['web-style']: style }) }
      }
    })

    this.props.store.updateMessages(updatedMessages)
  }

  handleMessageClicked = async eventId => {
    const { data } = await this.props.bp.axios.get('/mod/extensions/events/' + eventId)
    updater.callback(data)

    this.highlightGroupedMessages(eventId)
  }

  render() {
    return (
      <div className={style.hovering} onClick={this.handleMessageClicked.bind(this, this.props.incomingEventId)}>
        {this.props.children}
      </div>
    )
  }
}

interface WrapperProps {
  incomingEventId: string
  store: any
  bp: any
}
