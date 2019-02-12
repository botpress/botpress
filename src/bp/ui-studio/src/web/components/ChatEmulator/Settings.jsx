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
      this.setState({ userId: this.props.userId, externalToken: this.props.externalToken })
    }
  }

  handleSave = () => {
    this.props.onUpdateSettings({ userId: this.state.userId, externalToken: this.state.externalToken })
    this.props.onHideSettings()
  }

  handleOnChange = event => this.setState({ [event.target.name]: event.target.value })

  render() {
    return (
      <Modal show={this.props.show} onHide={this.props.hideSettings}>
        <Modal.Header>
          <strong>Configure Emulator Settings</strong>
        </Modal.Header>
        <Modal.Body>
          <div>
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
          <Button onClick={this.handleSave}>Save</Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
