import { Button, Tab, Tabs, Tooltip } from '@blueprintjs/core'
import axios from 'axios'
import cn from 'classnames'
import _ from 'lodash'
import moment from 'moment'
import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { toggleBottomPanel } from '~/actions'
import { RootReducer } from '~/reducers'
import { LogEntry } from '~/reducers/logs'
import { downloadBlob } from '~/util'

import style from './BottomPanel.styl'

interface IProps {
  logs: LogEntry[]
  toggleBottomPanel: () => void
}

interface IState {
  followLogs: boolean
  selectedPanel: string
  logsLimit: number
  initialLogs: LogEntry[]
}

class BottomPanel extends React.Component<IProps, IState> {
  messageListRef = React.createRef<HTMLUListElement>()

  componentDidMount() {
    this.queryLogs()
  }

  state = {
    followLogs: true,
    selectedPanel: 'bt-panel-logs',
    logsLimit: 200,
    initialLogs: []
  }

  queryLogs = async () => {
    const { data } = await axios.get(`${window.BOT_API_PATH}/logs`, {
      params: {
        limit: this.state.logsLimit
      }
    })

    this.setState({
      initialLogs: data.map((x, idx) => ({
        id: `initial-log-${idx}`,
        message: x.message,
        level: x.level || 'debug',
        ts: new Date(x.timestamp),
        args: x.metadata
      }))
    })
  }

  renderEntry(log: LogEntry): JSX.Element {
    const time = moment(new Date(log.ts)).format('YYYY-MM-DD HH:mm:ss')
    return (
      <li className={cn(style.entry, style[`level-${log.level}`])} key={'log-entry-' + log.id}>
        <span className={style.time}>{time}</span>
        <span className={style.level}>{log.level}</span> <span className={style.message}>{log.message}</span>
      </li>
    )
  }

  componentDidUpdate() {
    if (this.state.followLogs) {
      this.scrollToBottom()
    }
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

  handleTabChange = e => this.setState({ selectedPanel: e })

  handleToggleFollowLogs = () => this.setState({ followLogs: !this.state.followLogs })

  handleDownloadLogs = async () => {
    const { data } = await axios.get(`${window.BOT_API_PATH}/logs/archive`, { responseType: 'blob' })
    const time = moment().format('YYYY-MM-DD-HH-mm-ss')
    downloadBlob(`logs-${time}.txt`, data)
  }

  render() {
    const allLogs = [...this.state.initialLogs, ...this.props.logs]
    const LogsPanel = (
      <ul className={style.logs} ref={this.messageListRef}>
        {allLogs.map(e => this.renderEntry(e))}
        <li className={style.end}>End of logs</li>
      </ul>
    )

    return (
      <div className={cn('bp3-dark', style.container)}>
        <Tabs
          id="BottomPanelTabs"
          className={style.tabs}
          onChange={this.handleTabChange}
          selectedTabId={this.state.selectedPanel}
        >
          <Tab id="bt-panel-logs" className={style.tab} title="Logs" panel={LogsPanel} />
          <Tabs.Expander />
          <div>
            <Tooltip content={<em>Scroll to follow logs</em>}>
              <Button
                minimal={true}
                icon={'sort'}
                intent={this.state.followLogs ? 'primary' : 'none'}
                small={true}
                type="button"
                onClick={this.handleToggleFollowLogs}
              />
            </Tooltip>

            <Tooltip content={<em>Download logs</em>}>
              <Button minimal={true} icon={'import'} small={true} type="button" onClick={this.handleDownloadLogs} />
            </Tooltip>

            <span className={style.divide} />

            <Tooltip content={<em>Close panel</em>}>
              <Button minimal={true} icon={'cross'} small={true} type="button" onClick={this.props.toggleBottomPanel} />
            </Tooltip>
          </div>
        </Tabs>
      </div>
    )
  }
}

const mapStateToProps = (state: RootReducer) => ({
  logs: state.logs.logs
})

const mapDispatchToProps = dispatch => bindActionCreators({ toggleBottomPanel }, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BottomPanel)
