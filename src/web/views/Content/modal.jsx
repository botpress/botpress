import React from 'react'
import { Modal } from 'react-bootstrap'

import axios from 'axios'
import _ from 'lodash'
import classnames from 'classnames'

import Form from 'react-jsonschema-form'

import style from './style.scss'

export default class CreateOrEditModal extends React.Component {
  handleEdit = event => {
    this.props.handleEdit(event.formData)
  }

  handleSave = event => {
    this.props.handleCreateOrUpdate(event.formData)
  }

  render() {
    return (
      <Modal
        container={document.getElementById('app')}
        className={style.modal}
        show={this.props.show}
        onHide={this.props.handleClose}
      >
        <Modal.Body className={style.modalBody}>
          <Form
            schema={this.props.schema}
            uiSchema={this.props.uiSchema}
            formData={this.props.formData}
            onChange={this.handleEdit}
            onSubmit={this.handleSave}
          />
          <button
            className={classnames('bp-button', 'bp-button-danger', style.cancel)}
            onClick={this.props.handleClose}
          >
            Cancel
          </button>
        </Modal.Body>
      </Modal>
    )
  }
}
