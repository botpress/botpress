import React from 'react'
import { Grid, Row, Col, Button, FormControl, ListGroup, ListGroupItem, Glyphicon } from 'react-bootstrap'
import Toggle from 'react-toggle'
import moment from 'moment'
import classnames from 'classnames'
import { RIETextArea } from 'riek'

import 'react-toggle/style.css'
import style from './style.scss'

export default class Upcoming extends React.Component {
  constructor() {
    super()
  }

  render() {
    const { task, axios } = this.props
    const when = moment(new Date(task.scheduledOn))
    const isSoon = when.diff(moment(), 'minutes') <= 30
    const whenClass = classnames(style.header_when, {
      [style.soon]: isSoon
    })

    const modifyUrl = '/mod/scheduler/schedules'

    const toggleEnabled = () => {
      axios.post(modifyUrl, Object.assign({}, task, { enabled: !task.enabled }))
    }

    const changeAction = value => {
      axios.post(modifyUrl, Object.assign({}, task, { action: value.textarea }))
    }

    const doDelete = () => {
      axios.delete(modifyUrl + '?id=' + task.id)
    }

    const header = (
      <div>
        <span className={style.header_id}>{task.id}</span>
        {'  '}
        <span className={whenClass}>({when.fromNow()})</span>
        <Glyphicon className={style.delete} glyph="trash" onClick={doDelete} />
        <Toggle
          className={classnames(style.toggle, style.enabled)}
          defaultChecked={task.enabled}
          onChange={toggleEnabled}
        />
      </div>
    )

    return (
      <ListGroupItem className={style.task} header={header}>
        <span className={style.line}>
          Type: <span className={style.type}>{task.schedule_type}</span>
        </span>
        <span className={style.line}>
          Trigger: <span className={style.trigger}>{task.schedule}</span>
        </span>
        <RIETextArea value={task.action} className={style.action} change={changeAction} propName="textarea" />
      </ListGroupItem>
    )
  }
}
