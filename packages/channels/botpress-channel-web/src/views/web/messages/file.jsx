import React, { Component } from 'react'

import { hexToRGBA } from './misc'

import style from './style.scss'

class FileMessage extends Component {
  constructor(props) {
    super(props)
    this.state = { hover: false }
  }

  renderLocalFile() {
    return (
      <div className={style.otherFile}>
        <div>{this.props.file.name} (local)</div>
      </div>
    )
  }

  renderRemoteFile() {
    if (this.props.file && this.props.file.mime) {
      if (this.props.file.mime.includes('image/')) return this.renderRemoteImage()
      else if (this.props.file.mime.includes('audio/')) return this.renderAudio()
      else if (this.props.file.mime.includes('video/')) return this.renderVideo()
      else if (this.props.file.mime.includes('audio/')) return this.renderAudio()
    } else {
      return (
        <div className={style.otherFile}>
          <a href={this.props.file.url}>{this.props.file.name}</a>
        </div>
      )
    }
  }

  renderRemoteImage() {
    return (
      <a href={this.props.file.url} target="_blank">
        <img src={this.props.file.url} title={this.props.file.name} />
      </a>
    )
  }
  renderAudio() {
    return (
      <audio controls>
        <source src={this.props.file.url} type={this.props.file.mime} />
      </audio>
    )
  }

  renderVideo() {
    return (
      <video width="240" controls>
        <source src={this.props.file.url} type={this.props.file.mime} />
      </video>
    )
  }

  render() {
    if (this.props.file.storage !== 'local') {
      return this.renderRemoteFile()
    }

    return this.renderLocalFile()
  }
}

export default FileMessage
