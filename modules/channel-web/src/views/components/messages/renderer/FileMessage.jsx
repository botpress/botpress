import React, { Component } from 'react'

export class FileMessage extends Component {
  renderLocalFile() {
    return (
      <div className={'bpw-file-message'}>
        <div>{this.props.file.name} (local)</div>
      </div>
    )
  }

  renderRemoteFile() {
    if (!this.props.file) {
      return null
    }

    const { url, mime, name } = this.props.file

    if (!mime) {
      return (
        <div className={'bpw-file-message'}>
          <a href={url} target="_blank">
            {name}
          </a>
        </div>
      )
    }

    if (mime.includes('image/')) {
      return (
        <a href={url} target="_blank">
          <img src={url} title={name} />
        </a>
      )
    } else if (mime.includes('audio/')) {
      return (
        <audio controls>
          <source src={url} type={mime} />
        </audio>
      )
    } else if (mime.includes('video/')) {
      return (
        <video width="240" controls>
          <source src={url} type={mime} />
        </video>
      )
    }
  }

  render() {
    if (this.props.file.storage !== 'local') {
      return this.renderRemoteFile()
    }

    return this.renderLocalFile()
  }
}
