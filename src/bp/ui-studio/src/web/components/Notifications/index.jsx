import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { Row, Col, Tooltip, OverlayTrigger } from 'react-bootstrap'
import moment from 'moment'
import classnames from 'classnames'
import axios from 'axios'
import EventBus from '~/util/EventBus'

const getNotificationStyle = (styles, notification) =>
  classnames({
    animated: true,
    fadeIn: true,
    notif: true,
    [styles.item]: true,
    [styles['level-' + notification.level]]: true,
    [styles['item-unread']]: !notification.read,
    'bp-item': true,
    ['bp-level-' + notification.level]: true,
    'bp-item-unread': !notification.read
  })

export default class NotificationComponent extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  constructor(props, context, { itemComponent, renderDivider, styles }) {
    super(props, context)

    this.itemComponent = itemComponent
    this.renderDivider = renderDivider
    this.styles = styles

    this.state = { selectedIndex: null }
  }

  onNotifClicked(notif) {
    this.markAsRead(notif)
    this.context.router.history.push(notif.url)
  }

  markAsRead = async notif => {
    await axios.post(`${window.BOT_API_PATH}/notifications/${notif.id}/read`)
    this.props.fetchNotifications()
  }

  markAllAsRead = async () => {
    await axios.post(`${window.BOT_API_PATH}/notifications/read`)
    this.props.fetchNotifications()
  }

  trashAll = async () => {
    await axios.post(`${window.BOT_API_PATH}/notifications/archive`)
    this.props.fetchNotifications()
  }

  renderMarkAsReadButton(notification, index) {
    if (this.state.selectedIndex !== index || notification.read) {
      return null
    }

    const onClickHandler = event => {
      event.preventDefault()
      event.stopPropagation()
      this.markAsRead(notification)
      return false
    }

    const tooltip = <Tooltip id="ttip">Mark as read</Tooltip>
    const checkClassName = classnames('glyphicon glyphicon-ok', this.styles['mark-read-btn'])

    return (
      <OverlayTrigger placement="left" overlay={tooltip}>
        <em className={checkClassName} onClick={onClickHandler} />
      </OverlayTrigger>
    )
  }

  renderMenuItem(notification, index) {
    const ItemComponent = this.itemComponent
    const styles = this.styles
    const date = moment(new Date(notification.date || notification.created_on)).fromNow()
    const className = getNotificationStyle(styles, notification)
    const checkButton = this.renderMarkAsReadButton(notification, index)
    const iconClass = classnames('icon', 'material-icons', this.styles.icon)

    return (
      <ItemComponent
        key={notification.id}
        className={className}
        onMouseOver={() => this.setState({ selectedIndex: index })}
        onMouseLeave={() => this.setState({ selectedIndex: -1 })}
      >
        <Row>
          <Col xs={11} onClick={() => this.onNotifClicked(notification)}>
            <strong className={styles.header}>
              <i className={iconClass}>{notification.icon || notification.module_icon}</i>
              &nbsp; {notification.name || notification.module_name}
            </strong>
            {this.renderMessage(notification.message)}
            <small className="text-muted">{date}</small>
          </Col>
          <Col xs={1} className={styles.markAsReadButton}>
            {checkButton}
          </Col>
        </Row>
      </ItemComponent>
    )
  }

  renderMenuItems(displayedNotifications) {
    const ItemComponent = this.itemComponent

    const renderDivider = index => {
      if (index + 1 === displayedNotifications.length) {
        return null
      } else {
        return this.renderDivider && <ItemComponent divider style={{ margin: 0 }} />
      }
    }

    return displayedNotifications.map((notif, i) => [this.renderMenuItem(notif, i), renderDivider(i)])
  }
}
