import cn from 'classnames'
import _ from 'lodash'
import React from 'react'
import ReactDOM from 'react-dom'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'
import { LogEntry } from '~/reducers/logs'

import style from './BottomPanel.styl'

interface IProps {
  logs: LogEntry[]
}

class BottomPanel extends React.Component<IProps> {
  messageListRef = React.createRef<HTMLUListElement>()

  renderEntry(log: LogEntry): JSX.Element {
    return (
      <li className={cn(style.entry, style[`level-${log.level}`])} key={'log-entry-' + log.id}>
        <span className={style.level}>{log.level}</span> <span className={style.message}>{log.message}</span>
      </li>
    )
  }

  componentDidUpdate() {
    this.scrollToBottom()
  }

  scrollToBottom = () => {
    const el = this.messageListRef.current
    if (!el) {
      return
    }

    const scrollHeight = el.scrollHeight
    const height = el.clientHeight
    const maxScrollTop = scrollHeight - height
    el.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0
  }

  render() {
    const logs = this.props.logs.map(e => this.renderEntry(e))

    return (
      <div className={style.container}>
        <ul className={style.logs} ref={this.messageListRef}>
          {logs}
          <li className={style.end}>End of logs</li>
        </ul>
      </div>
    )
  }
}

const mapStateToProps = (state: RootReducer) => ({
  logs: state.logs.logs
})

export default connect(
  mapStateToProps,
  null
)(BottomPanel)
