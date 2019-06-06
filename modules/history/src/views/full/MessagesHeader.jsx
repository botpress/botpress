import React from 'react'
import style from './style.scss'

import { MdFileDownload } from 'react-icons/md'
import { FiLink } from 'react-icons/fi'

import { CopyToClipboard } from 'react-copy-to-clipboard'
import ReactTooltip from 'react-tooltip'

export class MessagesHeader extends React.Component {
  constructor(props) {
    super(props)

    const flattenMessages = props.messageGroups.flatMap(mg => [mg.userMessage, ...mg.botMessages])
    const content = JSON.stringify(flattenMessages, null, 2)
    let blob = new Blob([content], { type: 'application/json' })
    this.fileURL = window.URL.createObjectURL(blob)
  }

  getLastMessageDate = messageGroups => {
    const maxDateMessage = _.maxBy(messageGroups, mg => mg.userMessage.createdOn)
    return new Date(maxDateMessage.userMessage.createdOn)
  }

  render() {
    return (
      <div className={style['message-header']}>
        {this.props.conversation && (
          <div>
            <div className={style['message-title']}>Conversation {this.props.conversation}</div>
            {!!this.props.messageGroups.length && (
              <div className={style['message-lastdate']}>
                Last message on : #{this.getLastMessageDate(this.props.messageGroups).toDateString()}
              </div>
            )}
            {!this.props.messageGroups.length && (
              <div className={style['message-lastdate']}>No messages with current filters</div>
            )}
          </div>
        )}
        <div className={style['message-header-icons']}>
          <div className={style['message-header-icon_item']}>
            <a
              href={this.fileURL}
              download="message_history"
              style={{
                color: '#233abc'
              }}
            >
              <MdFileDownload />
            </a>
          </div>
          <div className={style['message-header-icon_item']}>
            <CopyToClipboard text={window.location.href}>
              <FiLink data-tip data-for="copied" data-event="mousedown" data-event-off="mouseup" />
            </CopyToClipboard>
          </div>
        </div>
        <ReactTooltip id="copied" delayHide={500} effect="solid">
          <div>copied</div>
        </ReactTooltip>
      </div>
    )
  }
}
