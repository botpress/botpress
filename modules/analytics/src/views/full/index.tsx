import { Button, Card, Elevation, HTMLSelect, Label } from '@blueprintjs/core'
import { DateRangePicker, DateRange } from '@blueprintjs/datetime'
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
    const tomorrow = moment()
      .add(1, 'day')
      .startOf('day')
      .unix()

    this.fetchAnalytics(this.state.selectedChannel, aWeekAgo, tomorrow).then(({ data }) => {
      this.setState({ startDate: aWeekAgo, endDate: tomorrow, metrics: data })
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

  handleDateChange = (selectedDates: DateRange) => {
    console.log('dates:', selectedDates)
  }

  isLoaded = () => {
    return this.state.metrics && this.state.startDate && this.state.endDate
  }

  render() {
    if (this.isLoaded()) {
      const startDate = moment.unix(this.state.startDate).toDate()
      const endDate = moment.unix(this.state.endDate).toDate()
      console.log(startDate, endDate)

      return (
        <div>
          {/* <DateRangePicker onChange={this.handleDateChange} value={[startDate, endDate]} /> */}
          <div>
            Filter by
            <HTMLSelect onChange={this.handleFilterChange} defaultValue="all">
              {this.state.channels.map(c => {
                return <option value={c}>{c}</option>
              })}
            </HTMLSelect>
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
      <React.Fragment>
        <h3>Agent Usage</h3>
        <div className={style.metricsContainer}>
          {this.renderTimeSeriesChart('Sessions', this.getMetric('sessions_count'))}
          {/* {this.renderNumberMetric('Number of Sessions', this.getMetricCount('sessions_count'))} */}
          {this.renderTimeSeriesChart('Messages Received', this.getMetric('msg_received_count'))}
          {/* {this.renderNumberMetric('Total Messages Received', this.getMetricCount('msg_received_count'))} */}
          {this.renderNumberMetric('Goals Initiated', 34)}
          {this.renderNumberMetric('Goals Completed', '50%')}
          {this.renderNumberMetric('QNA Sent', 54)}
        </div>
      </React.Fragment>
    )
  }

  renderEngagement() {
    return (
      <React.Fragment>
        <h3>Engagement & Retention</h3>
        <div className={style.metricsContainer}>
          {this.renderNumberMetric('Avg Session Length', this.avgSessionLength())}
          {this.renderNumberMetric('Number of Users', this.getMetricCount('user_count'))}
          {this.renderNumberMetric('Number of New Users', '50%')}
          {this.renderNumberMetric('Number of Returning Users', 54)}
        </div>
      </React.Fragment>
    )
  }

  renderUnderstanding() {
    return (
      <React.Fragment>
        <h3>Understanding</h3>
        <div className={style.metricsContainer}>
          {this.renderNumberMetric('# Positive Goals Outcome', 12)}
          {this.renderNumberMetric('# Positive QNA Feedback', 34)}
          {this.renderNumberMetric('# Understood Messages', 34)}
          {this.renderNumberMetric('# Understood Top-Level Messages', '50%')}
        </div>
      </React.Fragment>
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
          <BarChart
            margin={{
              top: 0,
              right: 0,
              left: 0,
              bottom: 0
            }}
            data={this.mapDataForCharts(data)}
          >
            <Tooltip labelFormatter={this.formatTick} />
            <XAxis dataKey="time" tickCount={tickCount} tickFormatter={this.formatTick} />
            <YAxis />
            <Bar stackId="1" type="monotone" dataKey="web" stroke={colorWeb} fill={colorWeb} />
            <Bar stackId="1" type="monotone" dataKey="messenger" stroke={colorMessenger} fill={colorMessenger} />
            <Bar stackId="1" type="monotone" dataKey="slack" stroke={colorSlack} fill={colorSlack} />
            <Bar stackId="1" type="monotone" dataKey="telegram" stroke={colorTelegram} fill={colorTelegram} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }
}
