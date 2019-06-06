import React from 'react'
import style from './style.scss'
import { MdSearch } from 'react-icons/md'
import { IoMdFlag } from 'react-icons/io'
import classnames from 'classnames'

export class MessageGroup extends React.Component {
  // state = {
  //   isSelected: false
  // }

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
      <div className={style['message-group']}>
        <div className={style['message-group-header']}>
          {this.props.group.userMessage.decision && (
            <div className={style['message-group-explanation']}>
              <div className={style['message-group-confidence']}>{`${Math.round(
                this.props.group.userMessage.decision.confidence * 10000
              ) / 100}% decision:`}</div>
              <div className={style['message-group-decision']}>{` ${
                this.props.group.userMessage.decision.sourceDetails
              }`}</div>
            </div>
          )}
          <div className={style['message-group-flag']}>
            {this.props.group.isFlagged && <IoMdFlag />}
            <input type="checkbox" checked={this.props.isSelected} onChange={() => this.handleSelection()} />
            <div
              className={style['message-inspect']}
              onClick={() => this.props.focusMessage(this.props.group.userMessage)}
            >
              <MdSearch />
            </div>
          </div>
        </div>
        <div className={style['message-sender']}>User:</div>
        {
          <div className={classnames(style['message-elements'], style['message-incomming'])}>
            {this.props.group.userMessage.preview}
          </div>
        }
        <div className={style['message-sender']}>Bot:</div>
        {this.props.group.botMessages.map(m => {
          return (
            <div
              className={classnames(
                style['message-elements'],
                m.direction === 'outgoing' ? style['message-outgoing'] : style['message-incomming']
              )}
              key={`${m.id}: ${m.direction}`}
              value={m.id}
            >
              {m.preview}
            </div>
          )
        })}
      </div>
    )
  }
}
