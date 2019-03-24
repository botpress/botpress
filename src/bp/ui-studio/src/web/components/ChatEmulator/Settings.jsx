import React from 'react'
import { Modal, Button, FormControl } from 'react-bootstrap'

import _ from 'lodash'

export default class Settings extends React.Component {
  state = {
    userId: '',
    externalToken: ''
  }

  componentDidUpdate(prevProps) {
    if (this.props !== prevProps) {
      this.setState({
        userId: this.props.userId,
        externalToken: this.props.externalToken,
        isSendingRawPayload: this.props.isSendingRawPayload,
        isVerticalView: this.props.isVerticalView
      })
    }
  }

  handleSave = () => {
    this.props.onUpdateSettings({
      userId: this.state.userId,
      externalToken: this.state.externalToken,
      isSendingRawPayload: this.state.isSendingRawPayload,
      isVerticalView: this.state.isVerticalView
    })
    this.props.onHideSettings()
  }

  handleToggle = event => this.setState({ [event.target.name]: event.target.checked })
  handleOnChange = event => this.setState({ [event.target.name]: event.target.value })

  render() {
    return (
      <Modal show={this.props.show} onHide={this.props.onHideSettings}>
        <Modal.Header>
          <strong>Configure Emulator Settings</strong>
        </Modal.Header>
        <Modal.Body>
          <div>
            <input
              id="rawPayload"
              type="checkbox"
              checked={this.state.isSendingRawPayload}
              onChange={this.handleToggle}
              name="isSendingRawPayload"
            />
            <label htmlFor="rawPayload"> Send Raw Payloads (JSON mode)</label>
            <br />
            <input
              id="vertical"
              type="checkbox"
              checked={this.state.isVerticalView}
              onChange={this.handleToggle}
              name="isVerticalView"
            />
            <label htmlFor="vertical"> Split view vertically</label>
            <h5>User ID</h5>
            <FormControl
              type="text"
              name="userId"
              value={this.state.userId}
              onChange={this.handleOnChange}
              placeholder="Choose a custom User ID"
            />

            <h5>External Authentication Token</h5>
            <FormControl
              type="text"
              as="textarea"
              rows="3"
              name="externalToken"
              value={this.state.externalToken}
              onChange={this.handleOnChange}
              placeholder="Type a valid JWT token"
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button bsStyle="default" onClick={this.props.onHideSettings}>
            Cancel
          </Button>
          <Button bsStyle="primary" onClick={this.handleSave}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
