import React from 'react'
import { Modal } from 'react-bootstrap'

import axios from 'axios'
import _ from 'lodash'
import classnames from 'classnames'

import Form from 'react-jsonschema-form'

import style from './style.scss'

export default class AddMessageModal extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: true
    }
  }

  componentDidMount() {
    this.setState({
      loading: false
    })
  }

  handleSubmit(event) {
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
            onSubmit={::this.handleSubmit}
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
