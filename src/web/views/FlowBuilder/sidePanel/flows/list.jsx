import React, { Component } from 'react'
import ReactDOM from 'react-dom'

import { ListGroup, ListGroupItem, Popover, Button, MenuItem, Overlay } from 'react-bootstrap'

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

    const handleDelete = () => {
      hideOverlay()
      setTimeout(() => {
        if (confirm('Are you sure you want to delete this flow?') === true) {
          alert('DONE')
        }
      }, 250)
    }

    const dropdown = (
      <Popover id={`flow-${index}-dropdown`}>
        <ul className={style.menu}>
          <MenuItem onClick={handleDelete}>Delete</MenuItem>
          <MenuItem>Duplicate</MenuItem>
        </ul>
      </Popover>
    )

    const hideOverlay = () => {
      this.setState({
        showDropdown: -1
      })
    }

    const overlayShown = this.state.showDropdown === index

    const showOverlay = () => {
      this.setState({
        showDropdown: index
      })
    }

    const ref = 'menu-btn-' + index

    const caret = (
      <Button bsSize="xsmall" ref={ref} onClick={showOverlay}>
        <span className="caret" />
      </Button>
    )

    const overlay = (
      <Overlay
        onHide={hideOverlay}
        show={overlayShown}
        animation={false}
        trigger="click"
        rootClose
        placement="bottom"
        target={() => ReactDOM.findDOMNode(this.refs[ref])}
      >
        {dropdown}
      </Overlay>
    )

    const lgProps = isCurrentFlow ? {} : { href: '#' }

    return (
      <ListGroupItem {...lgProps}>
        <div onClick={() => this.switchToFlow(flow)}>
          {flow.name}
          {dirtyMarker} {isCurrentFlow ? ' (current)' : ''}
        </div>
        <div className={style.menuButton}>{caret}</div>
        {overlay}
      </ListGroupItem>
    )
  }

  render() {
    return <ListGroup className={style.list}>{this.props.flows.map((f, i) => this.renderFlow(f, i))}</ListGroup>
  }
}
