import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { sortable } from 'react-sortable'
import { Row, Col } from 'react-bootstrap'
import _ from 'lodash'
import classnames from 'classnames'

import style from './style.scss'

class MiddlewareComponent extends Component {

  static propTypes = {
    middleware: React.PropTypes.object.isRequired
  }

  render() {
    const { name } = this.props.middleware
    const className = classnames(this.props.className, style.middleware)
    return <div className={className}>- {name}</div>
  }
}

var ListItem = React.createClass({
  displayName: 'SortableListItem',
  render: function() {
    return (
      <div {...this.props} className="list-item">{this.props.children}</div>
    )
  }
})

var SortableListItem = sortable(ListItem)

export default class MiddlewaresComponent extends Component {

  static propTypes = {
    middlewares: React.PropTypes.array.isRequired
  }

  constructor(props, context) {
    super(props, context)
    this.state = { 
      incoming: [], 
      outgoing: [],
      incomingDragIndex: null,
      incomingItems: [],
      outgoingDragIndex: null,
      outgoingItems: []
    }
  }

  componentWillReceiveProps(nextProps) {
    const incoming = _.filter(nextProps.middlewares, { type: 'incoming' })
    const outgoing = _.filter(nextProps.middlewares, { type: 'outgoing' })
    this.setState({ 
      incoming, 
      outgoing, 
      incomingItems: _.map(incoming, i => i.name),
      outgoingItems: _.map(outgoing, i => i.name)
    })
  }

  handleSort(type) {
    return (data) => {
      if (data.items) {
        this.setState({ [type + 'Items']: data.items })
      }

      if (typeof(data.draggingIndex) !== 'undefined') {
        this.setState({ [type + 'DragIndex']: data.draggingIndex })
      }
    }
  }

  renderSortable(type) {

    const itemsKey = type + 'Items'
    const items = this.state[itemsKey]
    const dragIndexKey = type + 'DragIndex'

    if (!items) {
      return null
    }

    return items.map((item, i) => {

      const middleware = _.find(this.state[type], { name: item })
      const currentlyDragging = this.state[dragIndexKey] === i
      const className = classnames({
        [style.dragging]: currentlyDragging
      })

      return <SortableListItem 
        key={i}
        updateState={::this.handleSort(type)} 
        items={items} 
        draggingIndex={this.state[dragIndexKey]} 
        sortId={i}
        outline="list">
        <MiddlewareComponent middleware={middleware} className={className} />
      </SortableListItem>
    })
  }

  render() {
    return <Row>
      <Col sm={12} md={6}>
        {this.renderSortable('incoming')}
      </Col>

      <Col sm={12} md={6}>
        {this.renderSortable('outgoing')}
      </Col>
    </Row>
  }

}
