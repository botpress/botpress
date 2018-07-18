import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { sortable } from 'react-sortable'

import { ListGroup, ListGroupItem, Tooltip, OverlayTrigger } from 'react-bootstrap'
import _ from 'lodash'
import classnames from 'classnames'

import axios from 'axios'

import { operationAllowed } from '~/components/Layout/PermissionsChecker'

import style from './style.scss'

class MiddlewareComponent extends Component {
  static propTypes = {
    middleware: PropTypes.object.isRequired,
    toggleEnabled: PropTypes.func,
    readOnly: PropTypes.bool
  }

  render() {
    const { name, enabled, module, description } = this.props.middleware
    const { readOnly } = this.props
    const className = classnames(this.props.className, style.middleware, 'bp-middleware', {
      [style.disabled]: !enabled,
      ['bp-disabled']: !enabled
    })
    const tooltip = description ? <Tooltip id={`module-${name}-description`}>{description}</Tooltip> : null

    return (
      <div>
        <div className={className} onClick={readOnly ? null : this.props.toggleEnabled}>
          <div className={classnames(style.helpIcon, 'bp-help-icon')}>
            <OverlayTrigger placement="left" overlay={tooltip}>
              <i className="material-icons">help</i>
            </OverlayTrigger>
          </div>
          <div>
            <span className={classnames(style.circle, 'bp-circle')} />
            <h4>{module}</h4>
          </div>
          <div>
            Handler: <b>{name || 'N/A'}</b>
          </div>
        </div>
      </div>
    )
  }
}

const ListItem = ({ children, ...props }) => (
  <ListGroupItem {...props} className="list-item">
    {children}
  </ListGroupItem>
)

const SortableListItem = sortable(ListItem)

class Middlewares extends Component {
  static propTypes = {
    type: PropTypes.string.isRequired
  }

  state = {
    loading: true,
    incoming: [],
    outgoing: [],
    incomingDragIndex: null,
    incomingItems: [],
    outgoingDragIndex: null,
    outgoingItems: [],
    initialStateHash: null
  }

  initialized = false

  init() {
    if (this.initialized || !this.props.user || this.props.user.id == null) {
      return
    }
    this.initialized = true
    this.canRead = operationAllowed({ user: this.props.user, op: 'read', res: 'bot.middleware.list' })
    this.canEdit = operationAllowed({ user: this.props.user, op: 'write', res: 'bot.middleware.customizations' })

    if (this.canRead) {
      axios.get('/api/middlewares').then(({ data }) => this.setMiddlewares(data))
    }
  }

  componentDidMount() {
    this.init()
  }

  componentDidUpdate() {
    this.init()
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

  handleSort = type => data => {
    if (data.items) {
      this.setState({ [type + 'Items']: data.items })
    }

    if (typeof data.draggingIndex !== 'undefined') {
      this.setState({ [type + 'DragIndex']: data.draggingIndex })
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
      const readOnly = !this.canEdit

      const innerComponent = (
        <MiddlewareComponent
          readOnly={readOnly}
          toggleEnabled={readOnly ? null : this.toggleEnabled(item, type)}
          middleware={middleware}
          className={className}
        />
      )

      if (readOnly) {
        return (
          <ListItem key={i} outline="list">
            {innerComponent}
          </ListItem>
        )
      } else {
        return (
          <SortableListItem
            key={i}
            updateState={this.handleSort(type)}
            items={items}
            draggingIndex={this.state[dragIndexKey]}
            sortId={i}
            outline="list"
          >
            {innerComponent}
          </SortableListItem>
        )
      }
    })
  }

  isDirty() {
    return this.state.initialStateHash !== null && this.state.initialStateHash !== this.getStateHash()
  }

  renderIsDirty() {
    const classNames = classnames('bp-button', style.saveButton, this.isDirty() ? style.dirty : null)

    return (
      <button className={classNames} onClick={this.saveChanges}>
        Save
      </button>
    )
  }

  saveChanges = () => {
    this.setState({ loading: true })

    const middlewares = []

    if (this.props.type === 'incoming') {
      this.state.incomingItems.forEach((item, i) => {
        const middleware = _.find(this.state.incoming, { name: item })
        middlewares.push({ name: item, order: i, enabled: middleware.enabled })
      })
    } else {
      this.state.outgoingItems.forEach((item, i) => {
        const middleware = _.find(this.state.outgoing, { name: item })
        middlewares.push({ name: item, order: i, enabled: middleware.enabled })
      })
    }

    axios.post('/api/middlewares/customizations', { middlewares }).then(({ data }) => this.setMiddlewares(data))
  }

  toggleEnabled(middleware, type) {
    return () => {
      const newProp = _.map(this.state[type], m => {
        if (m.name === middleware) {
          return Object.assign({}, m, { enabled: !m.enabled })
        }

        return m
      })

      this.setState({ [type]: newProp })
    }
  }

  renderIncoming() {
    const tooltip = (
      <Tooltip id="header-incoming-tooltip">
        An incoming middleware is a message processor&nbsp; that has the potential to track, alter or swallow
        messages.&nbsp; Usually, messages are put (sent) into the incoming middleware queue&nbsp; by{' '}
        <strong>connector modules</strong> such as Facebook Messenger, Slack...
      </Tooltip>
    )

    const title = 'Incoming middleware'

    return this.renderList('incoming', title, tooltip)
  }

  renderOutgoing() {
    const tooltip = (
      <Tooltip id="header-outgoing-tooltip">
        An outgoing middleware is a message processor&nbsp; that has the potential to track, alter or swallow messages
        to be sent.&nbsp; Usually, messages are put (sent) into the outgoing middleware queue by user code or incoming
        modules.&nbsp;
        <strong>Connector modules</strong> are in charge of sending the messages to the users, thus they should&nbsp;
        usually be placed at the end of the chain.
      </Tooltip>
    )

    const title = 'Outgoing middleware'

    return this.renderList('outgoing', title, tooltip)
  }

  renderList(type, title, tooltip) {
    return (
      <ListGroup className={classnames(style.middlewareList, 'bp-middleware-list')}>
        <ListGroupItem>
          <div className={classnames(style.header, 'bp-header')}>
            {this.renderIsDirty()}
            <h4>{title}</h4>
            <OverlayTrigger placement="right" overlay={tooltip}>
              <a className={classnames(style.help, 'bp-help')}>what&apos;s this?</a>
            </OverlayTrigger>
          </div>
        </ListGroupItem>
        {this.renderSortable(type)}
        <ListGroupItem>
          <div className={style.footer} />
        </ListGroupItem>
      </ListGroup>
    )
  }

  render() {
    if (this.state.loading || !this.initialized) {
      return null
    }

    return this.props.type === 'incoming' ? this.renderIncoming() : this.renderOutgoing()
  }
}

const mapStateToProps = state => ({
  user: state.user
})

export default connect(mapStateToProps)(Middlewares)
