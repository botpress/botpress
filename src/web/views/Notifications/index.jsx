import { connect } from 'react-redux'
import { ListGroup, ListGroupItem, Panel, Button, Tooltip, OverlayTrigger } from 'react-bootstrap'
import _ from 'lodash'

import NotificationComponent from '~/components/Notifications'
import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'

import styles from './style.scss'

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
    const canTrash = notifications.length > 0

    const trashTip = <Tooltip id="ttip">Delete all</Tooltip>
    const readTip = <Tooltip id="ttip">Mark all as read</Tooltip>

    return (
      <ContentWrapper>
        <PageHeader>
          <span> Notifications</span>
        </PageHeader>
        <Panel>
          <div className="pull-right">
            <OverlayTrigger placement="left" overlay={readTip}>
              <Button disabled={unreadCount === 0} onClick={this.markAllAsRead.bind(this)}>
                <em className="glyphicon glyphicon-eye-open" />
              </Button>
            </OverlayTrigger>
            <OverlayTrigger placement="left" overlay={trashTip}>
              <Button className={styles['bar-btn']} disabled={!canTrash} onClick={this.trashAll.bind(this)}>
                <em className="glyphicon glyphicon-trash" />
              </Button>
            </OverlayTrigger>
          </div>
        </Panel>
        <ListGroup
          style={{
            padding: 0
          }}
        >
          {this.renderMenuItems(notifications)}
        </ListGroup>
      </ContentWrapper>
    )
  }
}

const mapStateToProps = state => ({ notifications: state.notifications })

export default connect(mapStateToProps)(NotificationHub)
