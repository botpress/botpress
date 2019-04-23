import React, { Component } from 'react'
import { Button, Modal, ModalHeader, ModalBody, FormGroup, Label } from 'reactstrap'
import { MdReplay } from 'react-icons/lib/md'
import Select from 'react-select'

import api from '../../../api'

const defaultState = {
  revisions: [],
  selectedRev: null
}

class RollbackBotModal extends Component {
  state = { ...defaultState }

  async componentDidUpdate(prevProps) {
    if (this.props.botId && prevProps.botId !== this.props.botId) {
      await this.fetchRevisions()
    }
  }

  fetchRevisions = () => {
    return api
      .getSecured()
      .get(`/admin/bots/${this.props.botId}/revisions`)
      .then(({ data }) => {
        const revisions = data.payload.revisions.map(rev => {
          const parts = rev.replace('.tgz', '').split('++')
          parts[1] = new Date(parseInt(parts[1], 10)).toLocaleString()
          return {
            label: parts.join(' - '),
            value: rev
          }
        })
        this.setState({ revisions })
      })
  }

  selectRev = selectedRev => {
    this.setState({ selectedRev }, () => {
      this.submitEl.focus()
    })
  }

  rollback = () => {
    if (
      window.confirm(
        `Are you sure you want to rollback bot ${this.props.botId}? All its content and flows will be overwritten`
      )
    ) {
      api
        .getSecured()
        .post(`/admin/bots/${this.props.botId}/rollback`, { revision: this.state.selectedRev.value })
        .then(() => {
          this.props.onRollbackSuccess && this.props.onRollbackSuccess()
          this.props.toggle()
          this.setState({ ...defaultState })
        })
    }
  }

  focus = () => {
    this.selectEl.focus()
  }

  render() {
    return (
      <Modal isOpen={this.props.isOpen} toggle={this.props.toggle} fade={false} onOpened={this.focus} autoFocus={false}>
        <ModalHeader toggle={this.props.toggle}>Rollback bot {this.props.botId || ''}</ModalHeader>
        <ModalBody>
          <p>Select from the available revisions below</p>
          <FormGroup>
            <Label for="name">
              <strong>Revisions</strong>
            </Label>
            <Select
              tabIndex="1"
              ref={el => (this.selectEl = el)}
              value={this.state.selectedRev}
              options={this.state.revisions}
              onChange={this.selectRev}
            />
          </FormGroup>
          <Button
            tabIndex="2"
            className="float-right"
            type="submit"
            color="primary"
            disabled={!this.state.selectedRev}
            onClick={this.rollback}
            innerRef={el => (this.submitEl = el)}
          >
            <MdReplay /> Rollback
          </Button>
          {!!this.state.error && <p className="text-danger">{this.state.error}</p>}
        </ModalBody>
      </Modal>
    )
  }
}

export default RollbackBotModal
