import React from 'react'
import ContentWrapper from '../Layout/ContentWrapper'
import {
  Row,
  Col,
  Button,
  Checkbox,
  Panel
} from 'react-bootstrap'
import axios from 'axios'
import _ from 'lodash'
import classnames from 'classnames'
import moment from 'moment'

import styles from './styles.css'

class LoggerView extends React.Component {

  constructor(props) {
    super(props)
    this.state = { autoRefresh: true, logs: null, limit: 25, hasMore: false }
    this.toggleAutoRefresh = this.toggleAutoRefresh.bind(this)
    this.queryLogs = this.queryLogs.bind(this)
    this.loadMore = this.loadMore.bind(this)
  }

  componentDidMount() {
    if(!this.state.logs) {
      this.queryLogs()
      this.refreshInterval = setInterval(this.queryLogs, 1000)
    }
  }

  componentWillUnmount() {
    clearInterval(this.refreshInterval)
    this.setState({ cancelLoading: true })
  }

  loadMore() {
    this.setState({ limit: this.state.limit + 50, logs: null })
  }

  toggleAutoRefresh() {
    if(this.state.autoRefresh) {
      clearInterval(this.refreshInterval)
    } else {
      this.refreshInterval = setInterval(this.queryLogs, 1000)
    }

    this.setState({ autoRefresh: !this.state.autoRefresh })
  }

  renderLine(line) {
    const ago = moment(new Date(line.timestamp)).format('MMM DD HH:mm:ss')

    return <li className={styles.line}>
      <span className={styles.ago}>{ago}</span>
      <span className={styles['level-' + line.level]}>{line.level + ': '}</span>
      <span className={styles.message}>{line.message}</span>
    </li>
  }

  renderLoading() {
    return <div style={{ marginTop: '20px' }} className="whirl traditional"></div>
  }

  queryLogs() {
    axios.get('/api/logs', {
      params: {
        limit: this.state.limit
      }
    })
    .then((result) => {
      if(this.state.cancelLoading) { return }
      this.setState({
        logs: result.data,
        hasMore: result.data && result.data.length >= this.state.limit
      })
    })
  }

  render() {
    const logs = (this.state.logs && this.state.logs.map(this.renderLine)) || this.renderLoading()
    const logsPanelClassName = classnames('panel', 'panel-default', styles['logs-panel'])
    const canLoadMore = this.state.limit < 500 && this.state.hasMore

    return <ContentWrapper>
      <Panel className={styles.panel}>
        <form className="pull-left">
          <Checkbox className={styles['panel-checkbox']}
            checked={this.state.autoRefresh}
            inline onChange={this.toggleAutoRefresh}>
            Auto refresh
          </Checkbox>
        </form>
        <div className="pull-right">
          <Button href="/api/logs/archive">Export logs archive</Button>
        </div>
      </Panel>
      <div className={logsPanelClassName}>
        <div className="panel-body">
          <ul className={styles.events}>
            {logs}
          </ul>
        </div>
        {canLoadMore && <div href="#" className={styles['logs-panel-footer']}>
          <a href="#" onClick={this.loadMore}>Load more</a>
        </div>}
      </div>
    </ContentWrapper>
  }
}

export default LoggerView
