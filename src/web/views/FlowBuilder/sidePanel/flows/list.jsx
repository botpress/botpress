import React, { Component } from 'react'

import { ListGroup, ListGroupItem } from 'react-bootstrap'

import _ from 'lodash'

export default class FlowsList extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  switchToFlow(flow) {
    console.log('Switch to:', flow)
    this.props.switchFlow(flow.name)
  }

  renderFlow(flow, index) {
    const isCurrentFlow = flow.name === _.get(this.props, 'currentFlow.name')

    return isCurrentFlow ? (
      <ListGroupItem>{flow.name} (current)</ListGroupItem>
    ) : (
      <ListGroupItem href="#" onClick={() => this.switchToFlow(flow)}>
        {flow.name}
      </ListGroupItem>
    )
  }

  render() {
    return <ListGroup>{this.props.flows.map((f, i) => this.renderFlow(f, i))}</ListGroup>
  }
}
