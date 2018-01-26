import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import classnames from 'classnames'

import { ListGroup, ListGroupItem, Popover, Button, MenuItem, Overlay } from 'react-bootstrap'

import _ from 'lodash'

const style = require('./style.scss')

export default class FlowsList extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  renderFlow(flow, index) {
    const isCurrentFlow = flow.name === _.get(this.props, 'currentFlow.name')
    const isDirty = _.includes(this.props.dirtyFlows, flow.name)

    const dirtyMarker = isDirty ? '*' : ''

    const hideOverlay = () => {
      this.setState({
        showDropdownIndex: -1
      })
    }

    const handleDelete = () => {
      hideOverlay()
      setTimeout(() => {
        if (confirm('Are you sure you want to delete this flow?') === true) {
          this.props.deleteFlow(flow.name)
        }
      }, 250)
    }

    const handleDuplicate = () => {
      hideOverlay()

      setTimeout(() => {
        let name = prompt('Enter the name of the new flow')

        if (!name) {
          return
        }

        name = name.replace(/\.flow\.json$/i, '')

        if (/[^A-Z0-9-_\/]/i.test(name)) {
          return alert('ERROR: The flow name can only contain letters, numbers, underscores and hyphens.')
        }

        if (_.includes(this.props.flows.map(f => f.name), name + '.flow.json')) {
          return alert('ERROR: This flow already exists')
        }

        this.props.duplicateFlow({ flowNameToDuplicate: flow.name, name: `${name}.flow.json` })
      }, 250)
    }

    const dropdown = (
      <Popover id={`flow-${index}-dropdown`} bsClass={classnames(style.popover, 'popover')}>
        <ul className={style.menu}>
          <li onClick={handleDelete}>Delete</li>
          <li onClick={handleDuplicate}>Duplicate</li>
        </ul>
      </Popover>
    )

    const overlayShown = this.state.showDropdownIndex === index

    const showOverlay = () => {
      this.setState({
        showDropdownIndex: index
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

    const lgProps = isCurrentFlow ? {} : { href: 'javascript:void(0);' }

    let displayName = flow.name
    const { stripPrefix } = this.props
    if (stripPrefix && displayName.startsWith(stripPrefix)) {
      displayName = displayName.substr(stripPrefix.length)
    }

    return (
      <ListGroupItem {...lgProps}>
        <div onClick={() => this.props.goToFlow(flow.name)}>
          {displayName}
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
