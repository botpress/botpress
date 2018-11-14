import React from 'react'
import { Grid, Row, Col, Button, FormControl, ListGroup, ListGroupItem, Glyphicon } from 'react-bootstrap'
import Toggle from 'react-toggle'
import moment from 'moment'
import classnames from 'classnames'
import { RIETextArea } from 'riek'

import 'react-toggle/style.css'
import style from './style.scss'

export default class Previous extends React.Component {
  constructor() {
    super()

    this.state = {
      showLogs: false
    }
  }

  render() {
    const { task, axios } = this.props
    const when = moment(new Date(task.scheduledOn))
    const whenClass = classnames(style.header_when)

    const toggleLogs = () => {
      this.setState({ showLogs: !this.state.showLogs })
    }

    const showLogs = !!task.logs ? (
      <span className={style.toggleLogs}>{this.state.showLogs ? 'show' : 'hide'}</span>
    ) : (
      <span>no logs available</span>
    )

    const header = (
      <div>
        <span className={style.header_id}>{task.id}</span>
        {'  '}
        <span className={whenClass}>({when.fromNow()})</span>
      </div>
    )

    return (
      <div>
        <ListGroupItem className={style.task} header={header}>
          <span className={style.line}>
            Status: <span className={style['status-' + task.status]}>{task.status}</span>
          </span>
          <span className={style.line}>Logs: {showLogs}</span>
        </ListGroupItem>
      </div>
    )
  }
}
