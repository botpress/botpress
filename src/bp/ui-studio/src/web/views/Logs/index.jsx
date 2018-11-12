import React, { Component } from 'react'
import { Button, Checkbox, Panel } from 'react-bootstrap'
import axios from 'axios'
import _ from 'lodash'
import classnames from 'classnames'
import moment from 'moment'

import PageHeader from '~/components/Layout/PageHeader'
import ContentWrapper from '~/components/Layout/ContentWrapper'
import { downloadBlob } from '~/util'

import styles from './style.scss'

class LoggerView extends Component {
  state = {
    autoRefresh: true,
    logs: null,
    limit: 25,
    hasMore: false
  }

  componentDidMount() {
    if (!this.state.logs) {
      this.queryLogs()
      this.refreshInterval = setInterval(this.queryLogs, 1000)
    }
  }

  componentWillUnmount() {
    clearInterval(this.refreshInterval)
    this.cancelLoading = true
  }

  loadMore = () => {
    this.setState(({ limit }) => ({ limit: limit + 200 }))
  }

  toggleAutoRefresh = () => {
    if (this.state.autoRefresh) {
      clearInterval(this.refreshInterval)
    } else {
      this.refreshInterval = setInterval(this.queryLogs, 1000)
    }

    this.setState({ autoRefresh: !this.state.autoRefresh })
  }

  renderLine(line, index) {
    const time = moment(new Date(line.timestamp)).format('YYYY-MM-DD HH:mm:ss')
    const message = line.message.replace(/\[\d\d?m/gi, '')

    return (
      <li key={`${index}.${message}`} className={styles.line}>
        <span className={styles.time}>{time}</span>
        <span className={styles['level-' + line.level]}>{line.level + ': '}</span>
        <span className={styles.message}>{message}</span>
      </li>
    )
  }

  renderLoading() {
    return <div style={{ marginTop: '20px' }} className="whirl traditional" />
  }

  queryLogs = async () => {
    const { data } = await axios.get(`${window.BOT_API_PATH}/logs`, {
      params: {
        limit: this.state.limit
      }
    })

    if (this.cancelLoading) {
      return
    }

    this.setState({
      logs: data,
      hasMore: data && data.length >= this.state.limit
    })
  }

  renderLines() {
    if (!_.isArray(this.state.logs)) {
      return this.renderLoading()
    }

    return this.state.logs.filter(x => _.isString(x.message)).map(this.renderLine)
  }

  downloadArchive = async () => {
    const { data } = await axios.get(`${window.BOT_API_PATH}/logs/archive`, { responseType: 'blob' })
    downloadBlob('logs.txt', data)
  }

  render() {
    const logs = this.renderLines()
    const logsPanelClassName = classnames('panel', 'panel-default', styles['logs-panel'])
    const canLoadMore = this.state.limit < 500 && this.state.hasMore

    return (
      <ContentWrapper>
        <PageHeader>
          <span>Logs</span>
        </PageHeader>
        <Panel className={styles.panel}>
          <Panel.Body>
            <form className="pull-left">
              <Checkbox
                className={styles['panel-checkbox']}
                checked={this.state.autoRefresh}
                inline
                onChange={this.toggleAutoRefresh}
              >
                Auto-refresh
              </Checkbox>
            </form>
            <div className="pull-right">
              <Button onClick={this.downloadArchive}>Download log archive</Button>
            </div>
          </Panel.Body>
        </Panel>
        <div className={logsPanelClassName}>
          <div className="panel-body">
            <ul className={styles.events}>{logs}</ul>
          </div>
          {canLoadMore && (
            <div href="#" className={styles['logs-panel-footer']} onClick={this.loadMore}>
              Load more
            </div>
          )}
        </div>
      </ContentWrapper>
    )
  }
}

export default LoggerView
