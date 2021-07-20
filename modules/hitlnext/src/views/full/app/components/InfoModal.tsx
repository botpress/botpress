import { FormGroup } from '@blueprintjs/core'
import { lang, Dialog } from 'botpress/shared'
import _ from 'lodash'
import React, { Component } from 'react'
import { Button } from 'react-bootstrap'

interface Props {
  isOpen?: boolean
  toggleOpen?: () => void
  email?: string
  tempPassword?: string
}

class InfoModal extends Component<Props> {
  state = {
    show: false
  }

  onClose = () => {
    this.setState({ show: false })
  }

  render() {
    return (
      <Dialog.Wrapper
        style={{ height: 300 }}
        title="Agent information"
        isOpen={this.props.isOpen}
        onClose={this.props.toggleOpen}
      >
        <Dialog.Body>
          <FormGroup label="Login Information">
            <div>
              <p>Email: {this.props.email}</p>
              <p>Temporary Password: {this.props.tempPassword}</p>
            </div>
          </FormGroup>
        </Dialog.Body>
        <Dialog.Footer>
          <Button onClick={this.props.toggleOpen}>Close</Button>
        </Dialog.Footer>
      </Dialog.Wrapper>
    )
  }
}

export default InfoModal
