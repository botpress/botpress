import React from 'react'

import { updater } from '.'
import style from './style.scss'

export class Wrapper extends React.Component<WrapperProps> {
  highlightGroupedMessages = eventId => {
    this.props.store.view.setHighlightedMessages(eventId)
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
