import React, { Component } from 'react'
import Dropzone from 'react-dropzone'
import style from '../style.scss'
import { Button, Tooltip, OverlayTrigger, Alert } from 'react-bootstrap'

export default class Uploader extends Component {
  dropzoneRef = React.createRef()

  onFilesDropped = async files => !this.props.isUploading && this.props.onUpload(files)

  render() {
    const tooltip = (
      <Tooltip id="tooltip">
        Supported file types: <strong>{this.props.mimeTypes}</strong>
      </Tooltip>
    )

    return (
      <div>
        <h3>Index new documents</h3>
        Drag & drop your documents below or click on the
        <br /> "Select files" button &nbsp;
        <OverlayTrigger placement="right" overlay={tooltip}>
          <Button bsSize="xs">?</Button>
        </OverlayTrigger>
        <div className={style.spacing}>
          <Dropzone
            ref={this.dropzoneRef}
            accept={this.props.mimeTypes}
            onDrop={this.onFilesDropped}
            className={style.dropzone}
            overlay={tooltip}
          />
        </div>
        <div className={style.spacing}>{this.renderStatus()}</div>
        <p>
          <Button onClick={() => this.dropzoneRef.current.open()}>Select files</Button>
        </p>
      </div>
    )
  }

  renderStatus() {
    return (
      this.props.status && (
        <Alert bsStyle={this.props.isError ? 'danger' : 'success'}>
          {this.props.status}
          {this.props.isUploading ? ` - ${this.props.uploadProgress} % completed` : ''}
        </Alert>
      )
    )
  }
}
