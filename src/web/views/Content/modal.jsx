import React from 'react'
import { Modal } from 'react-bootstrap'

import axios from 'axios'
import _ from 'lodash'
import classnames from 'classnames'

import Form from 'react-jsonschema-form'

import style from './style.scss'

export default class CreateOrEditModal extends React.Component {
  handleUpdate = event => {
    this.props.handleCreateOrUpdate(event.formData)
  }

  handleEdit = event => {
    this.props.handleEdit(event.formData)
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
            onSubmit={this.handleUpdate}
            onChange={this.handleEdit}
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
