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
        this.setState({ revisions: data.payload.revisions })
      })
  }

  selectRev = ({ value: selectedRev }) => {
    this.setState({ selectedRev })
  }

  rollback = () => {
    if (
      window.confirm(
        `Are you sure you want to rollback bot ${this.props.botId}? All its content and flows will be overwritten`
      )
    ) {
      api
        .getSecured()
        .post(`/admin/bots/${this.props.botId}/rollback`, { revision: this.state.selectedRev })
        .then(() => {
          this.setState({ ...defaultState })
          this.props.onRollbackSuccess && this.props.onRollbackSuccess()
          this.props.toggle()
        })
    }
  }

  render() {
    return (
      <Modal isOpen={this.props.isOpen} toggle={this.props.toggle} fade={false}>
        <ModalHeader toggle={this.props.toggle}>Rollback bot {this.props.botId}</ModalHeader>
        <ModalBody>
          <p>Select from the available revisions below</p>
          <FormGroup>
            <Label for="name">
              <strong>Revisions</strong>
            </Label>
            <Select
              value={
                this.state.selectedRev
                  ? { label: this.state.selectedRev.replace('.tgz', ''), value: this.state.selectedRev }
                  : null
              }
              options={this.state.revisions.map(rev => ({ label: rev.replace('.tgz', ''), value: rev }))}
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
