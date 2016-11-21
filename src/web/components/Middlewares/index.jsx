import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { sortable } from 'react-sortable'
import { Row, Col, Checkbox } from 'react-bootstrap'
import _ from 'lodash'
import classnames from 'classnames'
import Button from 'react-bootstrap-button-loader'

import axios from 'axios'

import style from './style.scss'

class MiddlewareComponent extends Component {

  static propTypes = {
    middleware: React.PropTypes.object.isRequired,
    toggleEnabled: React.PropTypes.func.isRequired
  }

  render() {

    const { name, enabled } = this.props.middleware
    const className = classnames(this.props.className, style.middleware)
    return <div className={className}>
      {name}
      <Checkbox checked={enabled} onChange={this.props.toggleEnabled} />
    </div>
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

  constructor(props, context) {
    super(props, context)
    this.state = {
      loading: true,
      incoming: [], 
      outgoing: [],
      incomingDragIndex: null,
      incomingItems: [],
      outgoingDragIndex: null,
      outgoingItems: [],
      initialStateHash: null
    }
  }

  getStateHash() {
    let hash = ''
    this.state.incomingItems.forEach(m => {
      const middleware = _.find(this.state.incoming, { name: m })
      hash += m + ':' + middleware.enabled + ' '
    })
    this.state.outgoingItems.forEach(m => {
      const middleware = _.find(this.state.outgoing, { name: m })
      hash += m + ':' + middleware.enabled + ' '
    })
    return hash
  }

  setMiddlewares(middlewares) {
    const incoming = _.filter(middlewares, { type: 'incoming' })
    const outgoing = _.filter(middlewares, { type: 'outgoing' })
    const incomingItems = _.map(incoming, i => i.name)
    const outgoingItems = _.map(outgoing, i => i.name)

    this.setState({
      loading: false,
      incoming, 
      outgoing, 
      incomingItems,
      outgoingItems,
      initialIncomingOrder: incomingItems.join(' '),
      initialOutgoingOrder: outgoingItems.join(' ')
    })

    setImmediate(() => this.setState({ initialStateHash: this.getStateHash() }))
  }

  componentDidMount() {
    axios.get('/api/middlewares')
    .then(({ data }) => this.setMiddlewares(data))
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
      const toggleFn = this.toggleEnabled(item, type)

      return <SortableListItem 
        key={i}
        updateState={::this.handleSort(type)} 
        items={items} 
        draggingIndex={this.state[dragIndexKey]} 
        sortId={i}
        outline="list">
        <MiddlewareComponent toggleEnabled={toggleFn} middleware={middleware} className={className} />
      </SortableListItem>
    })
  }

  isDirty() {
    return this.state.initialStateHash !== this.getStateHash()
  }

  renderIsDirty() {
    if (!this.isDirty()) {
      return null
    }

    return <Row>
      Changes will take effect only when saved
    </Row>
  }

  saveChanges() {
    this.setState({ loading: true })

    const middlewares = []

    this.state.incomingItems.forEach((item, i) => {
      const middleware = _.find(this.state.incoming, { name: item })
      middlewares.push({ name: item, order: i, enabled: middleware.enabled })
    })

    this.state.outgoingItems.forEach((item, i) => {
      const middleware = _.find(this.state.outgoing, { name: item })
      middlewares.push({ name: item, order: i, enabled: middleware.enabled })
    })

    axios.post('/api/middlewares/customizations', { middlewares })
    .then(({ data }) => this.setMiddlewares(data))
  }

  toggleEnabled(middleware, type) {
    return (event) => {
      const newProp = _.map(this.state[type], m => {
        if (m.name === middleware) {
          return Object.assign({}, m, { enabled: !m.enabled })
        }

        return m
      })

      this.setState({ [type]: newProp })
    }
  }

  render() {
    if (this.state.loading) {
      return <div>Loading...</div>
    }

    return <div>
      <Row>
        <Col sm={12} md={6}>
          {this.renderSortable('incoming')}
        </Col>

        <Col sm={12} md={6}>
          {this.renderSortable('outgoing')}
        </Col>
      </Row>
      {this.renderIsDirty()}
      <Row>
        <Button className={style.saveButton} onClick={::this.saveChanges} loading={this.state.loading}>
          Save changes
        </Button>
      </Row>
    </div>
  }

}
