import React, {Component} from 'react'
import { NavDropdown, MenuItem, Row, Col, Tooltip, OverlayTrigger } from 'react-bootstrap'
import _ from 'lodash'
import moment from 'moment'
import classnames from 'classnames'

import EventBus from '~/util/EventBus'

export default class NotificationComponent extends Component {

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }

  constructor(props, context, { itemComponent, renderDivider, styles }) {
    super(props, context)

    this.itemComponent = itemComponent
    this.renderDivider = renderDivider
    this.styles = styles

    this.state = { selectedIndex: null }
  }

  askForNotifications() {
    console.log('>> Ask for all notifications')
    // const { skin } = this.props
    // skin.events.emit('notifications.getAll')
  }

  onNotifClicked(notif) {
    this.markAsRead(notif)
    this.context.router.push(notif.url)
  }

  markAsRead(notif) {
    EventBus.default.emit('notifications.read', notif.id)
  }

  markAllAsRead() {
    EventBus.default.emit('notifications.allRead')
  }

  trashAll() {
    EventBus.default.emit('notifications.trashAll')
  }

  renderMenuItems(displayedNotifications) {
    const styles = this.styles
    const ItemComponent = this.itemComponent

    const renderDivider = (index) => {
      if (index + 1 === displayedNotifications.length) {
        return null
      } else {
        return this.renderDivider && <ItemComponent divider style={{margin: 0}} />
      }
    }
    return displayedNotifications.map((notif, i) => {

      const date = moment(new Date(notif.date)).fromNow()

      const className = classnames({
        animated: true,
        fadeIn: true,
        notif: true,
        [styles.item]: true,
        [styles['level-' + notif.level]]: true,
        [styles['item-unread']]: !notif.read
      })

      let checkButton = null
      if(this.state.selectedIndex == i && !notif.read) {
        const tooltip = <Tooltip id="ttip">Mark as read</Tooltip>
        const checkClassName = classnames('glyphicon glyphicon-ok', styles['mark-read-btn'])
        checkButton = <OverlayTrigger placement="left" overlay={ tooltip }>
        <em className={checkClassName} onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          this.markAsRead(notif)
          return false
        }
      }>
      </em>
      </OverlayTrigger>
      }

      const item = (
        <ItemComponent
          key={notif.id}
          className={className}
          onMouseOver={() => this.setState({ selectedIndex: i})}>
        <Row>
          <Col xs={11} onClick={() => this.onNotifClicked(notif)}>
            <strong className={styles.header}>
              <em className={notif.icon}>&nbsp;</em>
              {notif.name}
            </strong>
            {this.renderMessage(notif.message)}
            <small className="text-muted">{date}</small>
          </Col>
          <Col xs={1} className={styles.markAsReadButton}>
            {checkButton}
          </Col>
        </Row>
      </ItemComponent>
    )

      return [item , renderDivider(i) ]
    })
  }
}
