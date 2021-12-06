import { Button, Intent, Position, Tooltip as BpTooltip, Callout } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import { calculateOverviewForHost, groupEntriesByTime, mergeEntriesByTime, Metric } from 'common/monitoring'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'
import React, { Component, Fragment } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

import CheckRequirements from '~/app/common/CheckRequirements'
import Dropdown from '~/app/common/Dropdown'
import LoadingSection from '~/app/common/LoadingSection'
import PageContainer from '~/app/common/PageContainer'
import { AppState } from '~/app/rootReducer'
import { fetchBotHealth } from '~/workspace/bots/reducer'
import BotHealth from './BotHealth'
import ChartTooltip from './ChartTooltip'
import { fetchStats, refreshStats } from './reducer'
import style from './style.scss'
import SummaryTable from './SummaryTable'

interface Option {
  value: string
  label: string
}

const timeFrameOptions: Option[] = [
  { value: '1m', label: '1 minute' },
  { value: '5m', label: '5 minutes' },
  { value: '10m', label: '10 minutes' },
  { value: '15m', label: '15 minutes' },
  { value: '30m', label: '30 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '2h', label: '2 hours' },
  { value: '5h', label: '5 hours' }
]

const resolutionOptions: Option[] = [
  { value: '10s', label: '10 seconds' },
  { value: '30s', label: '30 seconds' },
  { value: '1m', label: '1 minutes' },
  { value: '5m', label: '5 minutes' },
  { value: '15m', label: '15 minutes' },
  { value: '30m', label: '30 minutes' },
  { value: '1h', label: '1 hour' }
]

const tickSize = { fontSize: 11 }

type Props = ConnectedProps<typeof connector>

interface State {
  intervalId: any
  timeFrame?: Option
  resolution?: Option
  preparedStats: any
  timeFrameOptions: Option[]
  lastUniqueEntries: any
  uniqueHosts: any
  autoRefresh: boolean
  error?: string
}

class Monitoring extends Component<Props, State> {
  state: State = {
    intervalId: null,
    timeFrame: undefined,
    resolution: undefined,
    preparedStats: undefined,
    timeFrameOptions,
    lastUniqueEntries: undefined,
    error: undefined,
    uniqueHosts: undefined,
    autoRefresh: false
  }

  componentDidMount() {
    this.setState({ timeFrame: timeFrameOptions[3], resolution: _.head(resolutionOptions) }, this.queryData)
  }

  componentWillUnmount() {
    if (this.state.intervalId) {
      clearInterval(this.state.intervalId)
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.rawStats !== this.props.rawStats) {
      this.prepareForDisplay()
    }
  }

  async queryData() {
    if (!this.state.timeFrame) {
      return
    }

    try {
      const fromTime = moment()
        .subtract(ms(this.state.timeFrame.value))
        .toDate()
        .getTime()

      const toTime = moment()
        .toDate()
        .getTime()

      this.props.fetchStats(fromTime, toTime)
    } catch (error) {
      this.setState({ error: error.message })
    }
  }

  prepareForDisplay() {
    if (!this.props.rawStats?.length || !this.state.resolution) {
      return
    }

    const lastUniqueEntries = _.sortBy(
      _.uniqBy(_.orderBy(this.props.rawStats, ['ts'], ['desc']), 'uniqueId'),
      'uniqueId'
    )

    const uniqueHosts = lastUniqueEntries.map(x => x.uniqueId || '')
    this.setState({ uniqueHosts, lastUniqueEntries })

    // Group results by interval, then calculates total and average
    const grouped = groupEntriesByTime(this.props.rawStats, this.state.resolution.value)
    if (grouped) {
      const merged = mergeEntriesByTime(grouped, uniqueHosts)
      this.setState({ preparedStats: merged })
    }
  }

  handleTimeFrameChanged = timeFrame => this.setState({ timeFrame }, this.queryData)
  handleResolutionChanged = resolution => this.setState({ resolution }, this.queryData)

  handleAutoRefreshChanged = event => {
    const autoRefresh = event.target.checked
    let intervalId: any = undefined

    if (autoRefresh && !this.state.intervalId) {
      intervalId = setInterval(() => this.refreshStats(), 10000)
    } else if (!autoRefresh && this.state.intervalId) {
      clearInterval(this.state.intervalId)
    }
    this.setState({ autoRefresh, intervalId })
  }

  toggleAutoRefresh = () => {
    const autoRefresh = !this.state.autoRefresh
    let intervalId: any = undefined

    if (autoRefresh && !this.state.intervalId) {
      intervalId = setInterval(() => this.refreshStats(), 10000)
    } else if (!autoRefresh && this.state.intervalId) {
      clearInterval(this.state.intervalId)
    }
    this.setState({ autoRefresh, intervalId })
  }

  renderTooltip = ({ active, payload, label }) => {
    if (active && payload) {
      return <ChartTooltip payload={payload} uniqueHosts={this.state.uniqueHosts} date={label} />
    }
  }

  refreshStats() {
    this.props.refreshStats()
    this.props.fetchBotStatus()
  }

  renderOverview() {
    const hosts: any[] = []

    this.state.lastUniqueEntries.forEach(entry => {
      const filteredEntries = this.props.rawStats?.filter(f => f.uniqueId === entry.uniqueId) as any

      hosts.push({
        host: entry.host,
        serverId: entry.serverId,
        uptime: entry.uptime,
        lastUpdate: _.last<any>(filteredEntries).ts,
        ...calculateOverviewForHost(filteredEntries)
      })
    })

    return <SummaryTable data={hosts} />
  }

  renderCpu() {
    return (
      <ResponsiveContainer height={300}>
        <LineChart data={this.state.preparedStats}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="ts" tickFormatter={val => moment(val).format('HH:mm')} scale="time" tick={tickSize} />
          <YAxis domain={[0, 100]} unit="%" tick={tickSize} width={50} />
          <YAxis yAxisId="r" orientation="right" width={30} />
          <Tooltip content={this.renderTooltip} />
          <Legend />

          <Line
            name="Memory Usage"
            dataKey="summary.mem.usage"
            unit="%"
            stroke="#1C4E80"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
          />
          <Line
            name="CPU Usage"
            dataKey="summary.cpu.usage"
            unit="%"
            stroke="#0091D5"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  renderMeasures() {
    return (
      <ResponsiveContainer height={300}>
        <ComposedChart data={this.state.preparedStats}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="ts" tickFormatter={val => moment(val).format('HH:mm')} tick={tickSize} />
          <YAxis yAxisId="l" domain={[0, 'dataMax']} tick={tickSize} width={50} />
          <YAxis yAxisId="r" domain={[0, 'dataMax']} tick={tickSize} width={30} orientation="right" />
          <Tooltip content={this.renderTooltip} />
          <Legend />
          <Bar stackId="stack" yAxisId="l" name="HTTP Requests" dataKey={`summary.${Metric.Requests}`} fill="#1C4E80" />
          <Bar stackId="stack" yAxisId="l" name="Events In" dataKey={`summary.${Metric.EventsIn}`} fill="#7E909A" />
          <Bar stackId="stack" yAxisId="l" name="Events Out" dataKey={`summary.${Metric.EventsOut}`} fill="#6AB187" />
          <Line
            yAxisId="r"
            name="Warnings"
            dataKey={`summary.${Metric.Warnings}`}
            stroke="#DBAE58"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="r"
            name="Errors"
            dataKey={`summary.${Metric.Errors}`}
            stroke="#db3737"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="r"
            name="Criticals"
            dataKey={`summary.${Metric.Criticals}`}
            stroke="#AC3E31"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    )
  }

  renderCharts() {
    if (!this.state.preparedStats) {
      return null
    }

    return (
      <div>
        <div className={style.row}>
          <div className={style.col}>
            <h5>CPU & Memory Usage (average)</h5>
            {this.renderCpu()}
          </div>
          <div className={style.col}>
            <h5>Metrics (total)</h5>
            {this.renderMeasures()}
          </div>
        </div>

        <div>
          <h5>Overview</h5>
          {this.renderOverview()}
        </div>

        <div>
          <h5>Bot Health</h5>
          <BotHealth />
        </div>
      </div>
    )
  }

  renderHeader() {
    return (
      <div className={style.toolbar}>
        <div className={style.left}></div>
        <div className={style.right}>
          <BpTooltip content="Time Frame" position={Position.BOTTOM}>
            <Dropdown
              items={timeFrameOptions}
              defaultItem={this.state.timeFrame}
              onChange={option => this.setState({ timeFrame: option }, this.queryData)}
              icon="calendar"
              small
              spaced
            />
          </BpTooltip>

          <BpTooltip content="Resolution" position={Position.BOTTOM}>
            <Dropdown
              items={resolutionOptions}
              defaultItem={this.state.resolution}
              onChange={option => this.handleResolutionChanged(option)}
              icon="key-tab"
              small
              spaced
            />
          </BpTooltip>

          <BpTooltip content="Auto-Refresh" position={Position.BOTTOM}>
            <Button
              icon="automatic-updates"
              intent={this.state.autoRefresh ? Intent.PRIMARY : Intent.NONE}
              onClick={this.toggleAutoRefresh}
              style={{ marginLeft: 10 }}
              small
            />
          </BpTooltip>
        </div>
      </div>
    )
  }

  renderNoStats() {
    return (
      <Callout title="No statistics to display">
        <p>Monitoring is enabled, however there is no statistics to display.</p>
        <p>
          Make sure your Redis configuration is correct (and that you have restarted the server if you just made the
          change).
        </p>
      </Callout>
    )
  }

  renderChild() {
    if (this.props.loading) {
      return <LoadingSection />
    }

    if (!this.props.rawStats || !this.props.rawStats.length) {
      return this.renderNoStats()
    }

    return (
      <Fragment>
        {this.renderHeader()}
        {this.renderCharts()}
      </Fragment>
    )
  }

  render() {
    return (
      <PageContainer title={lang.tr('admin.sideMenu.monitoring')} fullWidth superAdmin>
        <CheckRequirements requirements={['redis', 'pro']} feature="monitoring">
          {this.renderChild()}
        </CheckRequirements>
      </PageContainer>
    )
  }
}

const mapStateToProps = (state: AppState) => ({
  rawStats: state.monitoring.stats,
  lastDate: state.monitoring.lastDate,
  loading: state.monitoring.loading
})

const connector = connect(mapStateToProps, { fetchStats, refreshStats, fetchBotStatus: fetchBotHealth })

export default connector(Monitoring)
