import React from 'react'

import { Row, Col, Grid } from 'react-bootstrap'

import style from './style.scss'
import Interaction from './Interaction'

class FailureReport extends React.Component {
  renderMessage(response, source) {
    const { contentElements } = this.props

    if (typeof response === 'string') {
      const element = contentElements.find(el => el.id === response)
      response = (element && element.preview) || response
    }

    if (typeof response === 'object') {
      const InjectedModuleView = this.props.bp.getModuleInjector()
      return (
        <div className="bpw-from-bot" key={response}>
          <InjectedModuleView
            moduleName={'channel-web'}
            componentName={'Message'}
            extraProps={{ payload: response || 'error previewing' }}
            onNotFound={undefined}
          />
          <small>(source: {source})</small>
        </div>
      )
    } else {
      return (
        <div className="bpw-from-bot" key={response}>
          <div className="bpw-chat-bubble">{response}</div>
        </div>
      )
    }
  }

  renderInteraction(interaction) {
    const { userMessage, botReplies } = interaction
    return (
      <div style={{ margin: '0 15px 0 15px' }}>
        <div style={{ width: '100%', marginBottom: 3 }} align="right">
          <div className="bpw-from-user" style={{ width: 'auto' }}>
            <div className="bpw-chat-bubble">{userMessage}</div>
          </div>
        </div>

        {botReplies.map(({ botResponse, replySource }) => this.renderMessage(botResponse, replySource))}
      </div>
    )
  }

  render() {
    return (
      <Grid fluid={true}>
        <Row>
          <h4>Failure report</h4>
          <Col md={12}>
            <p>
              Failed to complete scenario at interaction <strong>#{this.props.failureIdx}</strong>. Skipped{' '}
              <strong>{this.props.skipped}</strong> remaining interactions
            </p>
            <p>
              <strong>Reason:&nbsp;</strong> {this.props.mismatch.reason}
            </p>
          </Col>
        </Row>
        <Row className={style.reportInteractions}>
          <Col md={6}>
            <p className="text-center">
              <strong>Expected interaction</strong>
            </p>
            <Interaction
              {...this.props.mismatch.expected}
              contentElements={this.props.contentElements}
              failure={true}
              mismatchIdx={this.props.mismatch.index}
            />
          </Col>
          <Col md={6}>
            <p className="text-center">
              <strong>Actual interaction</strong>
            </p>
            <Interaction
              {...this.props.mismatch.received}
              contentElements={this.props.contentElements}
              failure={true}
              mismatchIdx={this.props.mismatch.index}
            />
          </Col>
        </Row>
      </Grid>
    )
  }
}

export default FailureReport
