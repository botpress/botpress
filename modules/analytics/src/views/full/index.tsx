import { Button, Card, Elevation, HTMLSelect } from '@blueprintjs/core'
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

  render() {
    return (
      this.state.metrics && (
        <div>
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
    )
  }

  getMetricCount = metric =>
    this.state.metrics.filter(m => m.metric_name === metric).reduce((acc, cur) => acc + cur.value, 0)

  avgSessionLength = () => {
    const received = this.getMetricCount('msg_received_count')
    const sent = this.getMetricCount('msg_sent_count')
    const sessions = this.getMetricCount('sessions_count')
    return ((received + sent) / sessions).toFixed(2)
  }

  renderAgentUsage() {
    return (
      <React.Fragment>
        <h3>Agent Usage</h3>
        <div className={style.metricsContainer}>
          {this.renderNumberOfSessions(this.state.metrics.filter(x => x.metric_name === 'sessions_count'))}
          {this.renderNumberMetric('Number of Sessions', this.getMetricCount('sessions_count'))}
          {this.renderNumberMetric('Total Messages Received', this.getMetricCount('msg_received_count'))}
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

  mapToTimeSeries(metricData: any[]) {
    const a = metricData.map(x => {
      return {
        time: moment(x.created_on)
          .startOf('day')
          .unix(),
        [x.channel]: x.value
      }
    })

    console.log(a)

    return a
  }

  renderNumberOfSessions(data) {
    const tickCount = (this.state.endDate - this.state.startDate) / 86400

    return (
      <LineChart
        width={500}
        height={300}
        data={this.mapToTimeSeries(data)}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5
        }}
      >
        <CartesianGrid />
        <XAxis
          dataKey="time"
          type="number"
          domain={[this.state.startDate, this.state.endDate]}
          tickFormatter={unix => moment.unix(unix).format('DD-MM')}
        />
        <YAxis />
        <Tooltip labelFormatter={unix => moment.unix(unix).format('DD-MM')} />
        <Legend />
        <Line type="monotone" dataKey="web" stroke="#ffc658" />
        <Line type="monotone" dataKey="messenger" stroke="#8884d8" />
        <Line type="monotone" dataKey="slack" stroke="#de5454" />
        <Line type="monotone" dataKey="telegram" stroke="#8884d8" />
      </LineChart>
    )
  }
}
