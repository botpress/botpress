import { Button, Card, HTMLSelect, Tooltip as BPTooltip } from '@blueprintjs/core'
import { DateRange, DateRangeInput } from '@blueprintjs/datetime'
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css'
import axios from 'axios'
import { BotpressTooltip } from 'botpress/tooltip'
import { Container, SidePanel } from 'botpress/ui'
import classnames from 'classnames'
import _ from 'lodash'
import moment from 'moment'
import React, { Fragment } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import style from './style.scss'

const COLOR_SLACK = '#4A154B'
const COLOR_MESSENGER = '#0196FF'
const COLOR_WEB = '#FFA83A'
const COLOR_TELEGRAM = '#2EA6DA'
const SECONDS_PER_DAY = 86400
const sideList = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'agentUsage', label: 'Agent Usage' },
  { key: 'engagement', label: 'Engagement & Retention' },
  { key: 'understanding', label: 'Understanding' }
]

export default class Analytics extends React.Component<{ bp: any }> {
  state = {
    channels: ['all'],
    selectedChannel: 'all',
    metrics: [],
    startDate: undefined,
    endDate: undefined,
    shownSection: 'dashboard',
    showFilters: false,
    pageTitle: 'Dashboard'
  }

  componentDidMount() {
    void axios.get(`${window.origin + window['API_PATH']}/modules`).then(({ data }) => {
      const channels = data
        .filter(
          x =>
            x.name === 'channel-web' ||
            x.name === 'channel-messenger' ||
            x.name === 'channel-slack' ||
            x.name === 'channel-telegram'
        )
        .map(x => x.name.substring(8))

      this.setState((prevState: any) => ({ channels: [...prevState.channels, ...channels] }))
    })

    const aWeekAgo = moment()
      .subtract(7, 'days')
      .startOf('day')
      .unix()
    const today = moment()
      .startOf('day')
      .unix()

    void this.fetchAnalytics(this.state.selectedChannel, aWeekAgo, today).then(({ data }) => {
      this.setState({ startDate: aWeekAgo, endDate: today, metrics: data })
    })
  }

  fetchAnalytics = (channel, startDate, endDate) => {
    return this.props.bp.axios.get(`mod/analytics-v2/channel/${channel}`, {
      params: {
        start: startDate,
        end: endDate
      }
    })
  }

  handleFilterChange = ({ target: { value: selectedChannel } }) => {
    this.fetchAnalytics(selectedChannel, this.state.startDate, this.state.endDate).then(({ data }) => {
      this.setState({ metrics: data, selectedChannel })
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
      <div className={style.filtersInputWrapper}>
        <span className={style.inputLabel}>Date Range</span>
        <DateRangeInput
          closeOnSelection={true}
          formatDate={date => moment(date).format('MM-DD-YYYY')}
          maxDate={new Date()}
          parseDate={str => new Date(str)}
          onChange={this.handleDateChange}
          value={[startDate, endDate]}
        />
      </div>
    )
  }

  render() {
    if (!this.isLoaded()) {
      return null
    }

    const { channels, shownSection, pageTitle, selectedChannel, showFilters } = this.state
    const startDate = moment(moment.unix(this.state.startDate).toDate()).format('MMMM Do YYYY')
    const endDate = moment(moment.unix(this.state.endDate).toDate()).format('MMMM Do YYYY')

    return (
      <Container>
        <SidePanel>
          <ul className={classnames(style.sideListList)}>
            {sideList.map(item => (
              <li
                onClick={() => this.setState({ shownSection: item.key, pageTitle: item.label })}
                key={item.key}
                className={classnames(style.sideListItem, {
                  [style.sideListItemSelected]: item.key === shownSection
                })}
              >
                {item.label}
              </li>
            ))}
          </ul>
        </SidePanel>
        <div className={style.mainWrapper}>
          <div className={style.header}>
            <h1 className={style.pageTitle}>{pageTitle}</h1>
            <Button
              onClick={() => this.setState(({ showFilters }: any) => ({ showFilters: !showFilters }))}
              icon="filter"
              className={style.filtersButton}
            >
              Filters
            </Button>
          </div>
          {showFilters && (
            <div className={style.filtersWrapper}>
              <label className={style.filtersInputWrapper}>
                <span className={style.inputLabel}>Channel</span>
                <HTMLSelect onChange={this.handleFilterChange} defaultValue="all">
                  {channels.map(channel => {
                    return (
                      <option key={channel} value={channel}>
                        {this.capitalize(channel)}
                      </option>
                    )
                  })}
                </HTMLSelect>
              </label>
              {this.renderDateInput()}
            </div>
          )}
          <h2 className={classnames(style.appliedFilters, showFilters && style.filtersShowing)}>
            {this.capitalize(selectedChannel)} - {startDate} to {endDate}
          </h2>
          {shownSection === 'dashboard' && this.renderDashboard()}
          {shownSection === 'agentUsage' && this.renderAgentUsage()}
          {shownSection === 'engagement' && this.renderEngagement()}
          {shownSection === 'understanding' && this.renderUnderstanding()}
        </div>
      </Container>
    )
  }

  getMetricCount = metricName =>
    this.state.metrics.filter(m => m.metric_name === metricName).reduce((acc, cur) => acc + cur.value, 0)

  getAvgMsgPerSessions = () => {
    const augmentedMetrics = this.state.metrics.map(m => ({
      ...m,
      day: moment(m.created_on).format('DD-MM')
    }))
    const metricsByDate = _.sortBy(augmentedMetrics, 'day')
    const sessionsCountPerDay = metricsByDate.filter(m => m.metric_name === 'sessions_count')

    return sessionsCountPerDay.map(s => {
      const sentCount = augmentedMetrics.find(
        m => m.metric_name === 'msg_sent_count' && s.day === m.day && s.channel === m.channel
      )
      const receivedCount = augmentedMetrics.find(
        m => m.metric_name === 'msg_received_count' && s.day === m.day && s.channel === m.channel
      )
      return {
        value: Math.round((_.get(sentCount, 'value', 0) + _.get(receivedCount, 'value', 0)) / s.value),
        channel: s.channel,
        created_on: s.created_on
      }
    })
  }

  getUnderstoodPercent = () => {
    const received = this.getMetricCount('msg_received_count')
    const none = this.getMetricCount('msg_nlu_none')
    const percent = ((received - none) / received) * 100
    return `${this.getNotNaN(percent)}%`
  }

  getTopLevelUnderstoodPercent = () => {
    const received = this.getMetricCount('msg_received_count')
    const none = this.getMetricCount('top_msg_nlu_none')
    const percent = ((received - none) / received) * 100
    return `${this.getNotNaN(percent)}%`
  }

  getReturningUsers = () => {
    const activeUsersCount = this.getMetricCount('active_users_count')
    const newUsersCount = this.getMetricCount('new_users_count')
    const percent = (newUsersCount / activeUsersCount) * 100
    return `${this.getNotNaN(percent)}%`
  }

  getNotNaN = value => (Number.isNaN(value) ? 0 : value.toFixed(2))

  getMetric = metricName => this.state.metrics.filter(x => x.metric_name === metricName)

  renderDashboard() {
    return (
      <div className={style.metricsContainer}>
        {this.renderTimeSeriesChart('Average Messages Per Session', this.getAvgMsgPerSessions())}
        {this.renderTimeSeriesChart('Active Users', this.getMetric('active_users_count'))}
        {this.renderTimeSeriesChart('New Users', this.getMetric('new_users_count'))}
        {this.renderNumberMetric('Positive QNA Feedback', this.getMetricCount('feedback_positive_qna'))}
        {this.renderNumberMetric('Understood Messages', this.getUnderstoodPercent())}
      </div>
    )
  }

  renderAgentUsage() {
    return (
      <div className={style.metricsContainer}>
        {this.renderTimeSeriesChart('Sessions', this.getMetric('sessions_count'))}
        {this.renderTimeSeriesChart('Messages Received', this.getMetric('msg_received_count'))}
        {this.renderTimeSeriesChart('Goals Started', this.getMetric('goals_started_count'))}
        {this.renderTimeSeriesChart('Goals Completed', this.getMetric('goals_completed_count'))}
        {this.renderTimeSeriesChart('QNA Sent', this.getMetric('msg_sent_qna_count'))}
      </div>
    )
  }

  renderEngagement() {
    return (
      <div className={style.metricsContainer}>
        {this.renderTimeSeriesChart('Average Messages Per Session', this.getAvgMsgPerSessions())}
        {this.renderTimeSeriesChart('Active Users', this.getMetric('active_users_count'))}
        {this.renderTimeSeriesChart('New Users', this.getMetric('new_users_count'))}
        {this.renderNumberMetric('Returning Users', this.getReturningUsers())}
      </div>
    )
  }

  renderUnderstanding() {
    const goalsOutcome = this.getMetricCount('goals_completed_count') / this.getMetricCount('goals_started_count') || 0

    return (
      <div className={style.metricsContainer}>
        {this.renderNumberMetric('Positive Goals Outcome', goalsOutcome + '%')}
        {this.renderNumberMetric('Positive QNA Feedback', this.getMetricCount('feedback_positive_qna'))}
        {this.renderNumberMetric('Understood Messages', this.getUnderstoodPercent())}
        {this.renderNumberMetric('Understood Top-Level Messages', this.getTopLevelUnderstoodPercent())}
      </div>
    )
  }

  renderNumberMetric(name, value) {
    return (
      <div className={classnames(style.metricWrapper, style.number)}>
        <BPTooltip content={name}></BPTooltip>
        <h4 className={style.metricName}>{name}</h4>
        <Card className={style.numberMetric}>
          <h2 className={style.numberMetricValue}>{value}</h2>
        </Card>
      </div>
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
    const tickCount = (this.state.endDate - this.state.startDate) / SECONDS_PER_DAY

    return (
      <div className={classnames(style.metricWrapper, !data.length && style.empty)}>
        <BPTooltip content={name}></BPTooltip>
        <h4 className={style.metricName}>{name}</h4>
        <div className={classnames(style.chartMetric, !data.length && style.empty)}>
          {!data.length && <p className={style.emptyState}>No data available</p>}
          {!!data.length && (
            <ResponsiveContainer>
              <AreaChart data={this.mapDataForCharts(data)}>
                <Tooltip labelFormatter={this.formatTick} />
                <XAxis height={18} dataKey="time" tickFormatter={this.formatTick} tickCount={tickCount} />
                <YAxis width={30} />
                <Area stackId={1} type="monotone" dataKey="web" stroke={COLOR_WEB} fill={COLOR_WEB} />
                <Area stackId={2} type="monotone" dataKey="messenger" stroke={COLOR_MESSENGER} fill={COLOR_MESSENGER} />
                <Area stackId={3} type="monotone" dataKey="slack" stroke={COLOR_SLACK} fill={COLOR_SLACK} />
                <Area stackId={4} type="monotone" dataKey="telegram" stroke={COLOR_TELEGRAM} fill={COLOR_TELEGRAM} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    )
  }
}
