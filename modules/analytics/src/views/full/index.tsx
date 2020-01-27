import { Button, Card, Elevation } from '@blueprintjs/core'
import React from 'react'

import style from './style.scss'

export default class AnalyticsModule extends React.Component {
  render() {
    return (
      <div>
        <div>Filter by</div>
        {this.renderAgentUsage()}
        {this.renderEngagement()}
        {this.renderUnderstanding()}
      </div>
    )
  }

  renderAgentUsage() {
    return (
      <React.Fragment>
        <h3>Agent Usage</h3>
        <div className={style.metricsContainer}>
          {this.renderNumberMetric('Number of Sessions', 12)}
          {this.renderNumberMetric('Total Messages Received', 34)}
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
          {this.renderNumberMetric('Avg Session Duration', 34)}
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
