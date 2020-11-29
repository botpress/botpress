import { Button, ButtonGroup, Divider, Tab, Tabs, Tooltip } from '@blueprintjs/core'
import anser from 'anser'
import axios from 'axios'
import { lang, ToolTip } from 'botpress/shared'
import cn from 'classnames'
import _ from 'lodash'
import moment from 'moment'
import nanoid from 'nanoid'
import React, { Fragment } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { toggleBottomPanel } from '~/actions'
import { downloadBlob } from '~/util'
import EventBus from '~/util/EventBus'

import style from '../style.scss'

import logStyle from './style.scss'
import Debug from './Debug'

const INITIAL_LOGS_LIMIT = 200
const MAX_LOGS_LIMIT = 500

interface Props {
  toggleBottomPanel: () => void
  emulatorOpen: boolean
  commonButtons: any
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
  private debugRef = React.createRef<any>()

  constructor(props) {
    super(props)
    this.logs = []
    this.debounceRefreshLogs = _.debounce(this.forceUpdate, 50, { maxWait: 300 })
  }

  componentDidMount() {
    // tslint:disable-next-line: no-floating-promises
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
    selectedPanel: 'logs',
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
      <li className={cn(logStyle.entry, logStyle[`level-${log.level}`])} key={'log-entry-' + log.id}>
        <span className={logStyle.time}>{time}</span>
        <span className={logStyle.level}>{log.level}</span>
        <span className={logStyle.message} dangerouslySetInnerHTML={{ __html: log.message }} />
        <span className={logStyle.message} dangerouslySetInnerHTML={{ __html: log.args || '' }} />
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

  handleTabChange = e => {
    this.setState({ selectedPanel: e })
  }

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
      <ul
        className={cn(logStyle.logs, style.tabContainer)}
        ref={this.messageListRef}
        onScroll={this.handleLogsScrolled}
      >
        {allLogs.map(e => this.renderEntry(e))}
        <li className={logStyle.end}>{lang.tr('bottomPanel.logs.endOfLogs')}</li>
      </ul>
    )

    return (
      <Tabs className={style.tabs} onChange={this.handleTabChange} selectedTabId={this.state.selectedPanel}>
        <Tab id="logs" className={style.tab} title={lang.tr('logs')} panel={LogsPanel} />
        <Tab id="debug" className={style.tab} title={lang.tr('debug')} panel={<Debug ref={this.debugRef} />} />

        {this.state.selectedPanel === 'logs' && (
          <Fragment>
            <Tabs.Expander />
            <ButtonGroup minimal={true}>
              <ToolTip content={lang.tr('bottomPanel.logs.scrollToFollow')}>
                <Button
                  id="btn-logs-follow"
                  icon={'sort'}
                  intent={this.state.followLogs ? 'primary' : 'none'}
                  small
                  onClick={this.handleToggleFollowLogs}
                />
              </ToolTip>

              <ToolTip content={lang.tr('bottomPanel.logs.downloadLogs')}>
                <Button id="btn-logs-download" icon={'import'} small onClick={this.handleDownloadLogs} />
              </ToolTip>

              <Divider />

              <ToolTip content={lang.tr('bottomPanel.logs.clearHistory')}>
                <Button id="btn-logs-clear" icon={'trash'} small onClick={this.handleClearLogs} />
              </ToolTip>

              {this.props.commonButtons}
            </ButtonGroup>
          </Fragment>
        )}

        {this.state.selectedPanel === 'debug' && (
          <Fragment>
            <Tabs.Expander />
            <ButtonGroup minimal>
              <ToolTip content={lang.tr('refresh')}>
                <Button
                  id="btn-debug-refresh"
                  icon="refresh"
                  small
                  onClick={this.debugRef.current?.loadConfiguration}
                />
              </ToolTip>

              {this.props.commonButtons}
            </ButtonGroup>
          </Fragment>
        )}
      </Tabs>
    )
  }
}

const mapStateToProps = state => ({
  emulatorOpen: state.ui.emulatorOpen
})

const mapDispatchToProps = dispatch => bindActionCreators({ toggleBottomPanel }, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(BottomPanel)
