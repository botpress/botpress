import React from 'react'
import { NavDropdown, MenuItem } from 'react-bootstrap'
import _ from 'lodash'
import NotificationComponent from './index.jsx'
import classnames from 'classnames'

import {connect} from 'nuclear-js-react-addons'
import getters from '~/stores/getters'

import styles from './hubStyle.scss'

@connect(props => ({ notifications: getters.notifications }))
class NotificationHub extends NotificationComponent {

  constructor(props, context) {
    super(props, context, { itemComponent: MenuItem, renderDivider: true, styles: styles })
  }

  renderMessage(message) {
    return <div className={styles.message}>{message}</div>
  }

  renderNoNotification() {
    return <MenuItem header className={styles['zero-notif']}>
      <div>You have no notifications !</div>
    </MenuItem>
  }
  render() {
    const notifications = this.props.notifications.toJS() || []
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
      <em className="glyphicon glyphicon-bell"></em>
      <span className={className}
        style={{ opacity: unreadCount > 0 ? 1 : 0}}>
        {unreadCount}
      </span>
    </span>

    return <NavDropdown id="notificationsDropdown" style={{padding: 0}} noCaret title={label} className={styles.dropdown}>
      <MenuItem header className={styles.topMenu}>
        <span>
          <strong>Notifications</strong>
          &nbsp;&nbsp;&middot;&nbsp;&nbsp;total of {notifications.length}
        </span>
        <div className="pull-right">
          <a href="#" onClick={() => this.markAllAsRead()}>Mark all as read</a>
          &nbsp;&nbsp;&middot;&nbsp;&nbsp;
          <a href="/notifications">Show all</a>
        </div>
      </MenuItem>
      {(notifications.length === 0 && this.renderNoNotification())}
      {this.renderMenuItems(displayedNotifications)}
    </NavDropdown>
  }
}

export default NotificationHub
