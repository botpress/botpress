import style from './StatusBar.styl'
import React from 'react'
import { Glyphicon } from 'react-bootstrap'
import _ from 'lodash'
import classNames from 'classnames'

export default class StatusBar extends React.Component {
  state = {
    delayAnimation: false,
    working: false,
    message: undefined
  }

  constructor(props) {
    super(props)
    this.endOfAnimationDelay = 2000
    this.expirationDelay = 4000
  }

  static getDerivedStateFromProps(props, state) {
    const moduleEventId = _.get(props, 'moduleEvent.id')

    if (moduleEventId === 'nlu.training' || moduleEventId === 'nlu.complete') {
      // Delay end of animation when the status changes from working to non-working
      if (state.working && !props.moduleEvent.working) {
        return { working: true, delayAnimation: true }
      }
      return { working: props.moduleEvent.working, delayAnimation: false, message: props.moduleEvent.message }
    }

    return null
  }

  expireLastMessage() {
    setTimeout(() => {
      this.setState({ message: undefined })
    }, this.expirationDelay)
  }

  delayEndOfAnimation() {
    if (this.state.delayAnimation) {
      setTimeout(() => {
        this.setState(
          { working: false, delayAnimation: false, message: this.props.moduleEvent.message },
          this.expireLastMessage
        )
      }, this.endOfAnimationDelay)
    }
  }

  flashWhileWorking = () => {
    return this.state.working ? style.statusBar__worker : ''
  }

  render() {
    this.delayEndOfAnimation()

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
          {this.state.message && (
            <li className={classNames(style.statusBar__listItem, this.flashWhileWorking())}>
              {this.state.working && <Glyphicon glyph="refresh" />}
              {!this.state.working && <Glyphicon glyph="ok" />}
              &nbsp;
              {this.state.message}
            </li>
          )}
        </ul>
        <span className={style.statusBar__separator} />
      </footer>
    )
  }
}
