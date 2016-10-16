import React from 'react'
import { NavDropdown, MenuItem, Row, Col, Tooltip, OverlayTrigger } from 'react-bootstrap'
import _ from 'lodash'
import moment from 'moment'
import classnames from 'classnames'

class NotificationComponent extends React.Component {

  constructor(props, context, { itemComponent, renderDivider, styles }) {
    super(props, context)

    this.itemComponent = itemComponent
    this.renderDivider = renderDivider
    this.styles = styles

    this.state = { notifications: null, selectedIndex: null }

    this.handleAllNotifications = this.handleAllNotifications.bind(this)
    this.handleNewNotification = this.handleNewNotification.bind(this)
  }

  handleAllNotifications(notifications) {
    this.setState({ notifications })
  }

  handleNewNotification(notification) {
    const notifications = this.state.notifications
    if(!notifications) {
      return
    }
    notifications.unshift(notification)
    this.setState({ notifications: notifications })
  }

  askForNotifications() {
    const { skin } = this.props
    skin.events.emit('notifications.getAll')
  }

  componentDidMount() {
    const { skin } = this.props
    skin.events.on('notifications.all', this.handleAllNotifications)
    skin.events.on('notifications.new', this.handleNewNotification)

    if(!this.state.notifications) {
      this.askForNotifications()
    }
  }

  componentWillUnmount() {
    const { skin } = this.props
    skin.events.off('notifications.all', this.handleAllNotifications)
    skin.events.off('notifications.new', this.handleNewNotification)
  }

  onNotifClicked(notif) {
    this.markAsRead(notif)
    this.context.router.push(notif.url)
  }

  markAsRead(notif) {
    this.props.skin.events.emit('notifications.read', notif.id)
  }

  markAllAsRead() {
    this.props.skin.events.emit('notifications.allRead')
  }

  trashAll() {
    this.props.skin.events.emit('notifications.trashAll')
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
        const checkClassName = classnames('icon-check', styles['mark-read-btn'])
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
          <Col lg={11} onClick={() => this.onNotifClicked(notif)}>
            <strong className={styles.header}>
              <em className={notif.icon}>&nbsp;</em>
              {notif.name}
            </strong>
            {this.renderMessage(notif.message)}
            <small className="text-muted">{date}</small>
          </Col>
          <Col lg={1} className={styles.markAsReadButton}>
            {checkButton}
          </Col>
        </Row>
      </ItemComponent>
    )

      return [item , renderDivider(i) ]
    })
  }
}

NotificationComponent.contextTypes = {
  router: React.PropTypes.object.isRequired
}

export default NotificationComponent
