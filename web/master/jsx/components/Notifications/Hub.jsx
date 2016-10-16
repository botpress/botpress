import React from 'react'
import { NavDropdown, MenuItem } from 'react-bootstrap'
import _ from 'lodash'
import NotificationComponent from './Component'
import classnames from 'classnames'

import styles from './hubStyle.css'

class NotificationHub extends NotificationComponent {

  constructor(props, context) {
    super(props, context, { itemComponent: MenuItem, renderDivider: true, styles: styles })
  }

  renderMessage(message) {
    return <div className={styles.message}>{message}</div>
  }

  render() {
    const notifications = this.state.notifications || []
    const unread = _.filter(notifications, { read: false })
    const unreadCount = unread.length
    const displayedNotifications = _.take(notifications, 6)

    const hasError = _.some(unread, (notif) => {
      return notif.level === 'error'
    })

    const className = classnames('label', {
      'label-danger': hasError,
      'label-default': !hasError
    })

    const label = <span>
      <em className="icon-bell"></em>
      <span className={className}
        style={{ opacity: unreadCount > 0 ? 1 : 0}}>
        {unreadCount}
      </span>
    </span>

    return <NavDropdown id="notificationsDropdown" style={{padding: 0}} noCaret eventKey={ 3 } title={label} className={styles.dropdown}>
      <MenuItem header className={styles.topMenu}>
        <strong>Notifications</strong>
        <div className="pull-right">
          <a href="#" onClick={() => this.markAllAsRead()}>Mark all as read</a>
          &nbsp;&nbsp;&middot;&nbsp;&nbsp;
          <a href="/notifications">Show all</a>
        </div>
      </MenuItem>
      {this.renderMenuItems(displayedNotifications)}
    </NavDropdown>
  }
}

export default NotificationHub
