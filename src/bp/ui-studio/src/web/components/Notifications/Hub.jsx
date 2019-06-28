import React from 'react'
import { connect } from 'react-redux'
import { NavDropdown, MenuItem } from 'react-bootstrap'
import _ from 'lodash'
import classnames from 'classnames'
import { fetchNotifications } from '~/actions'
import { Popover } from '@blueprintjs/core'
import '@blueprintjs/core/lib/css/blueprint.css'
import NotificationComponent from './index.jsx'
import styles from './hubStyle.scss'
import { GoBell } from 'react-icons/go'

const NB_OF_NOTIFICATIONS_TO_DISPLAY = 6

class NotificationHub extends NotificationComponent {
  constructor(props, context) {
    super(props, context, {
      itemComponent: MenuItem,
      renderDivider: true,
      styles: styles
    })
  }

  renderMessage(message) {
    return <div className={classnames(styles.message, 'bp-hub-message')}>{message}</div>
  }

  renderEmptyPanel() {
    return (
      <MenuItem header className={styles.empty}>
        <div>You have no notifications!</div>
      </MenuItem>
    )
  }

  render() {
    const notifications = this.props.notifications || []
    const isEmpty = notifications.length === 0
    const displayedNotifications = _.take(notifications, NB_OF_NOTIFICATIONS_TO_DISPLAY)
    const unread = _.filter(notifications, notif => notif.read === false || notif.read === 0)
    const unreadCount = unread.length

    const hasAnyError = _.some(unread, notif => {
      return notif.level === 'error'
    })

    const className = classnames('label', {
      'label-danger': hasAnyError,
      'label-default': !hasAnyError,
      invisible: unreadCount === 0
    })

    const label = <span>{unreadCount === 0 ? <GoBell /> : <span className={className}>{unreadCount}</span>}</span>

    return (
      <Popover
        content={
          <div className={classnames(styles.topMenu, 'bp-top-menu')}>
            <span>
              <strong>Notifications {!isEmpty && `(${notifications.length})`}</strong>
            </span>
            {!isEmpty && (
              <div className="pull-right">
                <a href="#" onClick={this.markAllAsRead}>
                  Mark all as read
                </a>
                &nbsp; &middot; &nbsp;
                <a href={window.BP_BASE_PATH + '/notifications'}>Show all</a>
              </div>
            )}
            {isEmpty && this.renderEmptyPanel()}
            {this.renderMenuItems(displayedNotifications)}
          </div>
        }
        target={label}
      />
    )
  }
}

const mapStateToProps = state => ({ notifications: state.notifications })

export default connect(
  mapStateToProps,
  { fetchNotifications }
)(NotificationHub)
