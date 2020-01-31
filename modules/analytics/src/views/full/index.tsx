import { Button, Card, Elevation, HTMLSelect } from '@blueprintjs/core'
import axios, { AxiosInstance } from 'axios'
import moment from 'moment'
import React from 'react'

import style from './style.scss'

export default class AnalyticsModule extends React.Component<{ bp: any }> {
  private axios: AxiosInstance

  state = {
    channels: ['web', 'slack', 'messenger', 'telegram', 'all'],
    metrics: [],
    startDate: undefined,
    endDate: undefined
  }

  componentDidMount() {
    const aWeekAgo = moment()
      .subtract(7, 'days')
      .startOf('day')
      .format('MM-DD-YYYY')
    const today = moment()
      .startOf('day')
      .format('MM-DD-YYYY')

    this.fetchAnalytics('all', aWeekAgo, today).then(({ data }) => {
      this.setState({ start: aWeekAgo, end: today, metrics: data })
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
      <div>
        <div>
          Filter by
          <HTMLSelect onChange={this.handleFilterChange}>
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
          {this.renderNumberMetric('Avg Session Messages', 12)}
          {this.renderNumberMetric('Avg Session Length', this.avgSessionLength())}
          {this.renderNumberMetric('Number of Users', 34)}
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
}
