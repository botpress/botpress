import React, { Component } from 'react'

import { Button, Alert } from 'react-bootstrap'
import moment from 'moment'
import style from '../style.scss'

export default class QueryTester extends Component {
  render() {
    const lastSync = this.props.lastSyncTimestamp
      ? moment(this.props.lastSyncTimestamp).format('MMMM Do YYYY, h:mm:ss')
      : 'Never'

    return (
      <div>
        <h3>Synchronization</h3>
        Documents are automatically synchronized when added from this interface. Manual sync is required when added
        manually
        <p>Last sync date: {lastSync}</p>
        <Button onClick={this.props.onSync} disabled={this.props.isSyncInProgress} bsStyle="success">
          Sync now
        </Button>
        <div className={style.spacing}>{this.renderStatus()}</div>
      </div>
    )
  }

  renderStatus() {
    return this.props.status && <Alert bsStyle={this.props.isError ? 'danger' : 'success'}>{this.props.status}</Alert>
  }
}
