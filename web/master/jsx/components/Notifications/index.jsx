import React from 'react'
import {ListGroup, ListGroupItem} from 'react-bootstrap'
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

        return <ContentWrapper>
            <div className="content-heading">
                Notifications
            </div>
            <ListGroup style={{
                padding: 0
            }}>
                {this.renderMenuItems(notifications)}
            </ListGroup>
        </ContentWrapper>
    }
}

export default NotificationHub
