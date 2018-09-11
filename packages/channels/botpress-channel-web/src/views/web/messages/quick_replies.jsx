import React, { Component } from 'react'

import { hexToRGBA } from './misc'

import style from './style.scss'
import FileInput from '../file_input'

class QuickReply extends Component {
  constructor(props) {
    super(props)
    this.state = { hover: false }
  }

  handleClick(event) {
    this.props.onQuickReplySend && this.props.onQuickReplySend(this.props.title, this.props.payload)
  }

  handleFileUpload(event) {
    if (!event.target.files) {
      return
    }

    this.props.onFileUploadSend &&
      this.props.onFileUploadSend(this.props.title, this.props.payload, event.target.files[0])
  }

  renderFileUpload(accept) {
    const backgroundColor = this.state.hover ? hexToRGBA(this.props.fgColor, 0.07) : hexToRGBA('#ffffff', 0.9)

    return (
      <button
        className={style.bubble}
        style={{ color: this.props.fgColor, backgroundColor }}
        onMouseOver={() => this.setState({ hover: true })}
        onMouseOut={() => this.setState({ hover: false })}
      >
        <span>{this.props.title}</span>
        <FileInput
          name="uploadField"
          accept={accept}
          className={style.filePicker}
          placeholder={this.props.title}
          onChange={::this.handleFileUpload}
        />
      </button>
    )
  }

  render() {
    const backgroundColor = this.state.hover ? hexToRGBA(this.props.fgColor, 0.07) : hexToRGBA('#ffffff', 0.9)

    if (this.props.payload === 'BOTPRESS.IMAGE_UPLOAD') {
      return this.renderFileUpload('image/*')
    }

    if (this.props.payload === 'BOTPRESS.FILE_UPLOAD') {
      return this.renderFileUpload('*/*')
    }

    return (
      <button
        className={`${style.bubble} ${style.floatNone}`}
        style={{ color: this.props.fgColor, backgroundColor }}
        onClick={::this.handleClick}
        onMouseOver={() => this.setState({ hover: true })}
        onMouseOut={() => this.setState({ hover: false })}
      >
        {this.props.title}
      </button>
    )
  }
}

const QuickReplies = props => {
  if (!props.quick_replies) {
    return null
  }

  const quick_replies = props.quick_replies.map((qr, index) => (
    <QuickReply key={`${index}-quick-reply`} {...props} {...qr} />
  ))

  return <div className={style.quickReplyContainer}>{quick_replies}</div>
}

export default QuickReplies
