import React, { Component } from 'react'

import {
  ListGroup,
  ListGroupItem,
  Popover,
  OverlayTrigger,
  Button,
  MenuItem,
  Clearfix,
  DropdownButton
} from 'react-bootstrap'

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

  renderFlow(flow, index) {
    const isCurrentFlow = flow.name === _.get(this.props, 'currentFlow.name')
    const isDirty = _.includes(this.props.dirtyFlows, flow.name)

    const dirtyMarker = isDirty ? '*' : ''

    const dropdown = (
      <Popover id={`flow-${index}-dropdown`}>
        <ul className={style.menu}>
          <MenuItem>Delete</MenuItem>
          <MenuItem>Duplicate</MenuItem>
        </ul>
      </Popover>
    )

    const caret = (
      <OverlayTrigger animation={false} trigger="click" rootClose placement="bottom" overlay={dropdown}>
        <Button bsSize="xsmall">
          <span className="caret" />
        </Button>
      </OverlayTrigger>
    )

    const lgProps = isCurrentFlow ? {} : { href: '#' }

    return (
      <ListGroupItem {...lgProps}>
        <div onClick={() => this.switchToFlow(flow)}>
          {flow.name}
          {dirtyMarker} {isCurrentFlow ? ' (current)' : ''}
        </div>
        <div className={style.menuButton}>{caret}</div>
      </ListGroupItem>
    )
  }

  render() {
    return <ListGroup className={style.list}>{this.props.flows.map((f, i) => this.renderFlow(f, i))}</ListGroup>
  }
}
