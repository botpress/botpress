import React from 'react'
import { connect } from 'react-redux'
import { ListGroup, ListGroupItem, Panel, Button, Tooltip, OverlayTrigger } from 'react-bootstrap'
import _ from 'lodash'

import NotificationComponent from '~/components/Notifications'

import { fetchNotifications } from '~/actions'
import styles from './style.scss'
import { lang } from 'botpress/shared'

// TODO: extending components is discouraged,
// should be reworked with composition eventually
class NotificationHub extends NotificationComponent {
  constructor(props, context) {
    super(props, context, {
      itemComponent: ListGroupItem,
      renderDivider: false,
      styles: styles
    })
  }

  renderMessage(message) {
    return <p className={styles.message}>{message}</p>
  }

  render() {
    const notifications = this.props.notifications || []
    const unreadCount = _.filter(notifications, { read: false }).length

    const trashTip = <Tooltip id="ttip">{lang.tr('studio.flow.notifications.deleteAll')}</Tooltip>
    const readTip = <Tooltip id="ttip">{lang.tr('studio.flow.notifications.markRead')}</Tooltip>

    return (
      <div>
        {notifications.length > 0 ? (
          <Panel>
            <Panel.Body>
              <div className="pull-right">
                <OverlayTrigger placement="left" overlay={readTip}>
                  <Button disabled={unreadCount === 0} onClick={this.markAllAsRead}>
                    <em className="glyphicon glyphicon-eye-open" />
                  </Button>
                </OverlayTrigger>
                <OverlayTrigger placement="left" overlay={trashTip}>
                  <Button className={styles['bar-btn']} onClick={this.trashAll}>
                    <em className="glyphicon glyphicon-trash" />
                  </Button>
                </OverlayTrigger>
              </div>
            </Panel.Body>
          </Panel>
        ) : (
          <div className={styles.empty}>
            <p>{lang.tr('studio.flow.notifications.noNotifs')}</p>
          </div>
        )}
        <ListGroup
          style={{
            padding: 0
          }}
        >
          {this.renderMenuItems(notifications)}
        </ListGroup>
      </div>
    )
  }
}

const mapStateToProps = state => ({ notifications: state.notifications })

export default connect(mapStateToProps, { fetchNotifications })(NotificationHub)
