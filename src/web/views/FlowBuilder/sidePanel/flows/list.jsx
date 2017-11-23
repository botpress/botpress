import React, { Component } from 'react'

import { ListGroup, ListGroupItem } from 'react-bootstrap'

import _ from 'lodash'

const style = require('./style.scss')

export default class FlowsList extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  switchToFlow(flow) {
    this.props.switchFlow(flow.name)
  }

  renderFlow(flow) {
    const isCurrentFlow = flow.name === _.get(this.props, 'currentFlow.name')
    const isDirty = _.includes(this.props.dirtyFlows, flow.name)

    const dirtyMarker = isDirty ? '*' : ''

    return isCurrentFlow ? (
      <ListGroupItem>
        {flow.name}
        {dirtyMarker} (current)
      </ListGroupItem>
    ) : (
      <ListGroupItem href="#" onClick={() => this.switchToFlow(flow)}>
        {flow.name}
        {dirtyMarker}
      </ListGroupItem>
    )
  }

  render() {
    return <ListGroup className={style.list}>{this.props.flows.map((f, i) => this.renderFlow(f, i))}</ListGroup>
  }
}
