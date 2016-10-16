import React from 'react'
import {ListGroup, ListGroupItem, Panel, Button, Tooltip, OverlayTrigger} from 'react-bootstrap'
import _ from 'lodash'
import NotificationComponent from './Component'
import ContentWrapper from '../Layout/ContentWrapper';

import styles from './pageStyle.css'

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
        const notifications = this.state.notifications || []
        const unreadCount = _.filter(notifications, {read: false}).length
        const canTrash = notifications.length > 0

        const trashTip = <Tooltip id="ttip">Delete all</Tooltip>
        const readTip = <Tooltip id="ttip">Mark all as read</Tooltip>

        return <ContentWrapper>
            <div className="content-heading">
                Notifications
            </div>
            <Panel>
              <div className="pull-right">
                <OverlayTrigger placement="left" overlay={readTip}>
                  <Button disabled={unreadCount === 0}
                    onClick={this.markAllAsRead.bind(this)}>
                    <em className="icon-eye fa-1x"></em>
                  </Button>
                </OverlayTrigger>
                <OverlayTrigger placement="left" overlay={trashTip}>
                  <Button className={styles['bar-btn']}
                    disabled={!canTrash}
                    onClick={this.trashAll.bind(this)}>
                    <em className="icon-trash fa-1x"></em>
                  </Button>
                </OverlayTrigger>
              </div>
            </Panel>
            <ListGroup style={{
                padding: 0
            }}>
                {this.renderMenuItems(notifications)}
            </ListGroup>
        </ContentWrapper>
    }
}

export default NotificationHub
