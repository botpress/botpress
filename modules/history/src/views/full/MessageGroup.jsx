import React from 'react'
import style from './style.scss'
import Interaction from './Interaction'
import moment from 'moment'
import { Checkbox, Icon, Button, Tooltip, Intent } from '@blueprintjs/core'

const formatConfidence = confidence => (+confidence * 100).toFixed(1)

const InfoTooltip = ({ userMessage }) => {
  const { decision, createdOn } = userMessage
  return (
    <div>
      {`${formatConfidence(decision.confidence)}% decision: ${decision.sourceDetails}`}
      <br />
      <br />
      Sent{' '}
      {moment(createdOn)
        .toDate()
        .toLocaleString()}
    </div>
  )
}

export class MessageGroup extends React.Component {
  componentWillUnmount() {
    this.props.handleSelection(false, this.props.group.userMessage)
  }

  handleSelection() {
    const newState = !this.props.isSelected
    this.props.handleSelection(newState, this.props.group)
  }

  render() {
    if (!this.props.group.userMessage) {
      return null
    }

    return (
      <div style={{ display: 'flex' }}>
        <Checkbox checked={this.props.isSelected} onChange={() => this.handleSelection()} />

        <div className={style.messageGroup} onClick={() => this.props.focusMessage(this.props.group.userMessage)}>
          <Interaction userMessage={this.props.group.userMessage.preview} botReplies={this.props.group.botMessages} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', padding: 3 }}>
          {this.props.group.isFlagged && (
            <Tooltip content="This message is flagged as wrong">
              <Icon icon="flag" intent={Intent.DANGER} className={style.iconWrap} />
            </Tooltip>
          )}

          <Tooltip content={<InfoTooltip userMessage={this.props.group.userMessage} />}>
            <Icon icon="info-sign" intent={Intent.PRIMARY} className={style.iconWrap} />
          </Tooltip>
        </div>
      </div>
    )
  }
}
