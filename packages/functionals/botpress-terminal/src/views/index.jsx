import React from 'react'

import { Col, Row, Grid, Button, Panel } from 'react-bootstrap'

import moment from 'moment'
import CodeMirror from 'react-codemirror'
import classnames from 'classnames'

import style from './style.scss'

require('codemirror/mode/javascript/javascript')
require('codemirror/lib/codemirror.css')

export default class TemplateModule extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      code: '',
      logs: null,
      result: null,
      executing: false,
      started: null,
      ended: null,
      error: null
    }
  }

  onChange(code) {
    this.setState({ code })
  }

  renderLogItem(line, index) {
    const time = moment(new Date(line.timestamp)).format('MMM DD HH:mm:ss')
    const message = line.message.replace(/\[\d\d?m/gi, '')

    return (
      <li key={`log_event_${index}`} className={style.line}>
        <span className={style.time}>{time}</span>
        <span className={style['level-' + line.level]}>{line.level + ': '}</span>
        <span className={style.message}>{message}</span>
      </li>
    )
  }

  renderLogs() {
    if (!this.state.ended) {
      return (
        <Panel>
          <Panel.Body>
            {!this.state.executing && <h3>You haven't run anything yet.</h3>}
            {this.state.executing && <h3>Running...</h3>}
          </Panel.Body>
        </Panel>
      )
    }

    if (this.state.error) {
      return (
        <Panel bsStyle="danger">
          <Panel.Heading>Execution error</Panel.Heading>
          <Panel.Body>
            <p>{this.state.error}</p>
          </Panel.Body>
        </Panel>
      )
    }

    const logs = Array.isArray(this.state.logs) && this.state.logs.map(this.renderLogItem)

    return (
      <Panel bsStyle="success" className={style.success}>
        <Panel.Heading>Execution results</Panel.Heading>
        <Panel.Body>
          <ul className={style.logs}>{logs}</ul>
          <div className={style.return}>
            <div className={style['return-header']}>Returned</div>
            <div className={style['return-body']}>{this.state.result || 'No return value'}</div>
          </div>
        </Panel.Body>
      </Panel>
    )
  }

  run() {
    if (this.executing) {
      return
    }

    this.setState({
      executing: true,
      started: new Date(),
      logs: null,
      result: null,
      ended: null,
      error: null
    })

    const api = '/api/botpress-terminal/run'

    this.props.bp.axios
      .post(api, { code: this.state.code })
      .then(({ data }) => {
        this.setState({
          executing: false,
          ended: new Date(),
          result: data.result,
          logs: data.logs
        })
      })
      .catch(err => {
        let message = err.message

        if (err.response && err.response.data && err.response.data.message) {
          message = err.response.data.message
        }

        this.setState({
          executing: false,
          ended: new Date(),
          error: message
        })
      })
  }

  render() {
    const editor = (
      <CodeMirror
        value={this.state.code}
        onChange={::this.onChange}
        options={{
          lineNumbers: true,
          readOnly: this.state.executing,
          mode: 'javascript'
        }}
      />
    )

    return (
      <div className={style.container}>
        <Row>
          <Col sm={12}>
            <Panel>
              <Panel.Heading>Terminal Scope</Panel.Heading>
              <Panel.Body>
                <p>The terminal allows you to run backend code directly from the bot's interface.</p>
                <p>
                  The global <code>bp</code> variable is available and also an instance of the database is provided for
                  convenience as <code>knex</code>.
                </p>
              </Panel.Body>
            </Panel>
          </Col>
        </Row>
        <Row>
          <Col sm={12} className={style.terminal}>
            {editor}
            <Button disabled={this.state.executing} onClick={::this.run} className={style.run}>
              Run
            </Button>
          </Col>
        </Row>
        <Row className={style.logsRow}>
          <Col sm={12}>{::this.renderLogs()}</Col>
        </Row>
      </div>
    )
  }
}
