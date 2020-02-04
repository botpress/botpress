import { Button, Card, Elevation, HTMLSelect, Label } from '@blueprintjs/core'
import { DateRange, DateRangeInput } from '@blueprintjs/datetime'
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css'
import axios, { AxiosInstance } from 'axios'
import _ from 'lodash'
import moment, { unix } from 'moment'
import React from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

import style from './style.scss'

const colorSlack = '#de5454'
const colorMessenger = '#568ee2'
const colorWeb = '#ffc658'
const colorTelegram = '#3d35df'

export default class AnalyticsModule extends React.Component<{ bp: any }> {
  state = {
    channels: ['all', 'web', 'slack', 'messenger', 'telegram'],
    selectedChannel: 'all',
    metrics: [],
    startDate: undefined,
    endDate: undefined
  }

  componentDidMount() {
    const aWeekAgo = moment()
      .subtract(7, 'days')
      .startOf('day')
      .unix()
    const today = moment()
      .startOf('day')
      .unix()

    this.fetchAnalytics(this.state.selectedChannel, aWeekAgo, today).then(({ data }) => {
      this.setState({ startDate: aWeekAgo, endDate: today, metrics: data })
    })
  }

  fetchAnalytics = (channel, startDate, endDate) => {
    return this.props.bp.axios.get(`/analytics/channel/${channel}`, {
      params: {
        start: startDate,
        end: endDate
      }
    })
  }

  handleFilterChange = event => {
    this.fetchAnalytics(event.target.value, this.state.startDate, this.state.endDate).then(({ data }) => {
      this.setState({ metrics: data })
    })
  }

  handleDateChange = async (dateRange: DateRange) => {
    const startDate = moment(dateRange[0]).unix()
    const endDate = moment(dateRange[1]).unix()

    const { data } = await this.fetchAnalytics(this.state.selectedChannel, startDate, endDate)
    this.setState({ startDate, endDate, metrics: data })
  }

  isLoaded = () => {
    return this.state.metrics && this.state.startDate && this.state.endDate
  }

  capitalize = str => str.substring(0, 1).toUpperCase() + str.substring(1)

  renderDateInput() {
    const startDate = moment.unix(this.state.startDate).toDate()
    const endDate = moment.unix(this.state.endDate).toDate()
    return (
      <DateRangeInput
        closeOnSelection={false}
        formatDate={date => moment(date).format('MMMM Do YYYY')}
        maxDate={new Date()}
        parseDate={str => new Date(str)}
        onChange={this.handleDateChange}
        value={[startDate, endDate]}
      />
    )
  }

  render() {
    if (this.isLoaded()) {
      return (
        <div>
          <div className={style.header}>
            Filter by&nbsp;
            <HTMLSelect onChange={this.handleFilterChange} defaultValue="all">
              {this.state.channels.map(channel => {
                return <option value={channel}>{this.capitalize(channel)}</option>
              })}
            </HTMLSelect>
            {this.renderDateInput()}
          </div>
          {this.renderAgentUsage()}
          {this.renderEngagement()}
          {this.renderUnderstanding()}
        </div>
      )
    }

    return null
  }

  getMetricCount = metricName =>
    this.state.metrics.filter(m => m.metric_name === metricName).reduce((acc, cur) => acc + cur.value, 0)

  avgSessionLength = () => {
    const received = this.getMetricCount('msg_received_count')
    const sent = this.getMetricCount('msg_sent_count')
    const sessions = this.getMetricCount('sessions_count')
    return ((received + sent) / sessions).toFixed(2)
  }

  getMetric = metricName => this.state.metrics.filter(x => x.metric_name === metricName)

  renderAgentUsage() {
    return (
      <div className={style.metricsSection}>
        <h3>Agent Usage</h3>
        <div className={style.metricsContainer}>
          {this.renderTimeSeriesChart('Sessions', this.getMetric('sessions_count'))}
          {/* {this.renderNumberMetric('Number of Sessions', this.getMetricCount('sessions_count'))} */}
          {this.renderTimeSeriesChart('Messages Received', this.getMetric('msg_received_count'))}
          {/* {this.renderNumberMetric('Total Messages Received', this.getMetricCount('msg_received_count'))} */}
          {this.renderTimeSeriesChart('Goals Started', this.getMetric('goals_started_count'))}
          {this.renderTimeSeriesChart('Goals Completed', this.getMetric('goals_completed_count'))}
          {this.renderTimeSeriesChart('QNA Sent', this.getMetric('msg_sent_qna_count'))}
        </div>
      </div>
    )
  }

  renderEngagement() {
    return (
      <div className={style.metricsSection}>
        <h3>Engagement & Retention</h3>
        <div className={style.metricsContainer}>
          {this.renderTimeSeriesChart('Number of Users', this.getMetric('users_count'))}
          {this.renderNumberMetric('Messages / Session', this.avgSessionLength())}
          {this.renderNumberMetric('Number of New Users', this.getMetricCount('new_users_count'))}
          {this.renderNumberMetric('Number of Returning Users', 54)}
        </div>
      </div>
    )
  }

  renderUnderstanding() {
    const goalsOutcome = this.getMetricCount('goals_completed_count') / this.getMetricCount('goals_started_count') || 0

    return (
      <div className={style.metricsSection}>
        <h3>Understanding</h3>
        <div className={style.metricsContainer}>
          {this.renderNumberMetric('# Positive Goals Outcome', goalsOutcome)}
          {this.renderNumberMetric('# Positive QNA Feedback', 34)}
          {this.renderNumberMetric('# Understood Messages', 34)}
          {this.renderNumberMetric('# Understood Top-Level Messages', '50%')}
        </div>
      </div>
    )
  }

  renderNumberMetric(name, value) {
    return (
      <Card className={style.numberMetric}>
        <h4 className={style.numberMetricName}>{name}</h4>
        <h2 className={style.numberMetricValue}>{value}</h2>
      </Card>
    )
  }

  mapDataForCharts(data: any[]) {
    const chartsData = data.map(metric => ({
      time: moment(metric.created_on)
        .startOf('day')
        .unix(),
      [metric.channel]: metric.value
    }))

    return _.sortBy(chartsData, 'time')
  }

  formatTick = timestamp => moment.unix(timestamp).format('DD-MM')

  renderTimeSeriesChart(name: string, data) {
    const aDayInSeconds = 86400
    const tickCount = (this.state.endDate - this.state.startDate) / aDayInSeconds

    return (
      <div className={style.chartMetric}>
        <h4 className={style.chartMetricName}>{name}</h4>
        <ResponsiveContainer>
          <AreaChart data={this.mapDataForCharts(data)}>
            <Tooltip labelFormatter={this.formatTick} />
            <XAxis dataKey="time" tickFormatter={this.formatTick} tickCount={tickCount} />
            <YAxis />
            <Area stackId="1" type="monotone" dataKey="web" stroke={colorWeb} fill={colorWeb} />
            <Area stackId="1" type="monotone" dataKey="messenger" stroke={colorMessenger} fill={colorMessenger} />
            <Area stackId="1" type="monotone" dataKey="slack" stroke={colorSlack} fill={colorSlack} />
            <Area stackId="1" type="monotone" dataKey="telegram" stroke={colorTelegram} fill={colorTelegram} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }
}
