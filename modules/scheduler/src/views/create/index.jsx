import React from 'react'
import { OverlayTrigger, Modal, ButtonToolbar, ButtonGroup, Button, Label, Alert, Badge } from 'react-bootstrap'
import { RIEInput, RIESelect, RIETextArea } from 'riek'
import chrono from 'chrono-node'
import _ from 'lodash'
import classnames from 'classnames'
import later from 'later'
import moment from 'moment'

import style from './style.scss'

const selectOptions = [
  { id: '1', text: 'CRON', default: '* * * * *', type: 'cron' },
  { id: '2', text: 'Natural expression', default: 'Every 2 days at 5:12 am', type: 'natural' },
  { id: '3', text: 'Once', default: 'Tomorrow at 9:15am', type: 'once' }
]

const defaultState = {
  show: false,
  id: 'New Schedule 1',
  expressionType: '1',
  expression: '* * * * *',
  action: `bp.notifications.send({
    level: 'success',
    message: 'Schedule triggered successfully'
  })`,
  error: null
}

export default class CreateModal extends React.Component {
  constructor(props) {
    super(props)
    this.state = Object.assign({}, defaultState)
  }

  show() {
    this.setState(Object.assign({}, defaultState, { show: true }))
  }

  close() {
    this.setState({ show: false })
  }

  onChange(prop, key) {
    return value => {
      this.setState({ [prop]: key ? _.get(value, key) : value })
    }
  }

  onExpressionTypeChange(value) {
    this.onChange('expressionType', 'select.id')(value)
    if (this.state.expressionType !== value.select.id) {
      const option = _.find(selectOptions, { id: value.select.id })
      this.setState({ expression: option.default })
    }
  }

  renderNextOccurences() {
    const occurences = []

    if (this.state.expressionType === '1') {
      // CRON
      later.date.localTime()
      const sched = later.parse.cron(this.state.expression)
      const next = later.schedule(sched).next(1)
      later
        .schedule(sched)
        .next(3)
        .map(o => occurences.push(o))
    } else if (this.state.expressionType === '2') {
      // Natural
      later.date.localTime()
      const sched = later.parse.text(this.state.expression)
      later
        .schedule(sched)
        .next(4)
        .map(o => occurences.push(o))
      occurences.shift()
    } else {
      // ONCE
      occurences.push(chrono.casual.parseDate(this.state.expression))
    }

    return (
      <div className={style.callout}>
        {occurences.map((o, i) => (
          <Label key={i}>{moment(o).format('lll')}</Label>
        ))}
      </div>
    )
  }

  create() {
    let schedule = this.state.expression

    if (this.state.expressionType === '3') {
      schedule = chrono.casual.parseDate(schedule)
    }

    const type = _.find(selectOptions, { id: this.state.expressionType }).type

    const url = '/mod/scheduler/schedules'
    this.props.axios
      .put(url, {
        schedule_type: type,
        schedule: schedule,
        enabled: true,
        action: this.state.action,
        id: this.state.id
      })
      .then(() => this.close())
      .catch(err => {
        this.setState({ error: err.response.data.message })
      })
  }

  renderError() {
    if (!this.state.error) {
      return null
    }

    return <Alert bsStyle="danger">{this.state.error}</Alert>
  }

  render() {
    const headerClass = classnames(style.editable, style.header)
    const expressionClass = classnames(style.editable)
    const actionClass = classnames(style.action, style.editable)

    return (
      <Modal show={this.state.show} onHide={::this.close} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            <RIEInput
              value={this.state.id}
              change={::this.onChange('id', 'text')}
              propName="text"
              className={headerClass}
            />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {::this.renderError()}
          <div className={style.expressions}>
            <span className={style.expressionType}>Expression type: </span>
            <RIESelect
              value={_.find(selectOptions, { id: this.state.expressionType })}
              className={expressionClass}
              change={::this.onExpressionTypeChange}
              options={selectOptions}
              propName="select"
            />
            <span className={style.expression}>Expression: </span>
            <RIEInput
              value={this.state.expression}
              className={style.editable}
              change={::this.onChange('expression', 'text')}
              propName="text"
            />
          </div>
          {::this.renderNextOccurences()}
          <div>
            <h4>Action</h4>
            <RIETextArea
              value={this.state.action}
              className={actionClass}
              change={::this.onChange('action', 'textarea')}
              propName="textarea"
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={::this.close}>Cancel</Button>
          <Button onClick={::this.create} bsStyle="primary">
            Schedule
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
