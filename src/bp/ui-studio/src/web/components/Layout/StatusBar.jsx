import style from './StatusBar.styl'
import React from 'react'
import _ from 'lodash'
import classNames from 'classnames'
import { Glyphicon } from 'react-bootstrap'

export default class StatusBar extends React.Component {
  state = {
    eventsStack: [],
    currentEvent: undefined,
    eraseMessage: false
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props !== prevProps) {
      const eventStack = this.state.eventsStack
      eventStack.push(this.props.statusBarEvent)
      const currentEvent = this.state.eventsStack.pop()

      if (currentEvent) {
        setTimeout(this.expireLastEvent, 3000)
      }

      this.setState({ eventStack, currentEvent })
    }
  }

  expireLastEvent() {
    this.setState({ currentEvent: undefined })
  }

  renderNluStatus() {
    const isEventFromNlu = _.get(this.state, 'currentEvent.type') === 'nlu'
    const event = this.state.currentEvent

    if (isEventFromNlu && event.message) {
      return (
        <li className={classNames(style.statusBar__listItem, event.working ? style.statusBar__worker : '')}>
          {!event.working && <Glyphicon glyph="ok" />}
          &nbsp;
          {event.message}
        </li>
      )
    }
  }

  render() {
    return (
      <footer className={style.statusBar}>
        <ul className={style.statusBar__list}>
          <li className={style.statusBar__listItem}>
            Botpress Version:&nbsp;
            {this.props.botpressVersion}
          </li>
          <li className={style.statusBar__listItem}>
            Active Bot:&nbsp;
            {this.props.botName}
          </li>
          {this.renderNluStatus()}
        </ul>
        <span className={style.statusBar__separator} />
      </footer>
    )
  }
}
