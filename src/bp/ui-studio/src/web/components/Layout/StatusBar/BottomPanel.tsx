import { Button, ButtonGroup, Divider, Tab, Tabs, Tooltip } from '@blueprintjs/core'
import anser from 'anser'
import axios from 'axios'
import cn from 'classnames'
import _ from 'lodash'
import moment from 'moment'
import nanoid from 'nanoid'
import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { toggleBottomPanel } from '~/actions'
import { downloadBlob } from '~/util'
import EventBus from '~/util/EventBus'

import style from './BottomPanel.styl'

const INITIAL_LOGS_LIMIT = 200
const MAX_LOGS_LIMIT = 500

interface Props {
  toggleBottomPanel: () => void
}

interface State {
  followLogs: boolean
  selectedPanel: string
  initialLogs: LogEntry[]
}

interface LogEntry {
  id: string
  level: string
  message: string
  args: any
  ts: Date
}

class BottomPanel extends React.Component<Props, State> {
  private messageListRef = React.createRef<HTMLUListElement>()
  private debounceRefreshLogs
  private logs: LogEntry[]

  constructor(props) {
    super(props)
    this.logs = []
    this.debounceRefreshLogs = _.debounce(this.forceUpdate, 50, { maxWait: 300 })
  }

  componentDidMount() {
    this.queryLogs()
    this.setupListener()
  }

  setupListener = () => {
    // @ts-ignore
    EventBus.default.on('logs::' + window.BOT_ID, ({ id, level, message, args }) => {
      this.logs.push({
        ts: new Date(),
        id: nanoid(10),
        level,
        message: anser.ansiToHtml(message),
        args: anser.ansiToHtml(args)
      })

      if (this.logs.length > MAX_LOGS_LIMIT) {
        this.logs.shift()
      }
      this.debounceRefreshLogs()
    })
  }

  state = {
    followLogs: true,
    selectedPanel: 'bt-panel-logs',
    initialLogs: []
  }

  queryLogs = async () => {
    const { data } = await axios.get(`${window.BOT_API_PATH}/logs`, {
      params: {
        limit: INITIAL_LOGS_LIMIT
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
        <span className={style.level}>{log.level}</span>
        <span className={style.message} dangerouslySetInnerHTML={{ __html: log.message }} />
        <span className={style.message} dangerouslySetInnerHTML={{ __html: log.args || '' }} />
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

  handleLogsScrolled = e => {
    // When zoomed, scrollTop may have decimals and must be rounded
    const isAtBottom = e.target.scrollHeight - Math.round(e.target.scrollTop) === e.target.clientHeight

    if (isAtBottom && !this.state.followLogs) {
      this.setState({ followLogs: true })
    } else if (!isAtBottom && this.state.followLogs) {
      this.setState({ followLogs: false })
    }
  }

  handleClearLogs = () => {
    this.logs = []
    this.setState({ initialLogs: [] })
  }

  render() {
    const allLogs = [...this.state.initialLogs, ...this.logs]
    const LogsPanel = (
      <ul className={style.logs} ref={this.messageListRef} onScroll={this.handleLogsScrolled}>
        {allLogs.map(e => this.renderEntry(e))}
        <li className={style.end}>End of logs</li>
      </ul>
    )

    return (
      <div className={cn(style.container)}>
        <Tabs
          id="BottomPanelTabs"
          className={style.tabs}
          onChange={this.handleTabChange}
          selectedTabId={this.state.selectedPanel}
        >
          <Tab id="bt-panel-logs" className={style.tab} title="Logs" panel={LogsPanel} />
          <Tabs.Expander />
          <ButtonGroup minimal={true}>
            <Tooltip content="Scroll to follow logs">
              <Button
                icon={'sort'}
                intent={this.state.followLogs ? 'primary' : 'none'}
                small={true}
                type="button"
                onClick={this.handleToggleFollowLogs}
              />
            </Tooltip>

            <Tooltip content="Download Logs">
              <Button icon={'import'} small={true} type="button" onClick={this.handleDownloadLogs} />
            </Tooltip>

            <Divider />

            <Tooltip content="Clear log history">
              <Button icon={'trash'} small={true} type="button" onClick={this.handleClearLogs} />
            </Tooltip>

            <Divider />

            <Tooltip content="Close Panel">
              <Button icon={'cross'} small={true} type="button" onClick={this.props.toggleBottomPanel} />
            </Tooltip>
          </ButtonGroup>
        </Tabs>
      </div>
    )
  }
}

const mapDispatchToProps = dispatch => bindActionCreators({ toggleBottomPanel }, dispatch)

export default connect(
  null,
  mapDispatchToProps
)(BottomPanel)
