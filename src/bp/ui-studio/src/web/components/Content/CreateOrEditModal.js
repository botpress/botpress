import React from 'react'
import { Modal, Button } from 'react-bootstrap'

import _ from 'lodash'
import classnames from 'classnames'

import ContentForm from '~/components/ContentForm'
import withLanguage from '../Util/withLanguage'
import style from './style.scss'

class CreateOrEditModal extends React.Component {
  state = {
    mustChangeLang: false
  }

  handleEdit = event => {
    this.props.handleEdit(event.formData)
  }

  handleSave = event => {
    this.props.handleCreateOrUpdate(event.formData)
  }

  useDefaultLang = () => {
    this.props.changeContentLanguage(this.props.defaultLanguage)
  }

  componentDidUpdate(prevProps) {
    if (prevProps.formData !== this.props.formData || this.props.contentLang !== prevProps.contentLang) {
      this.setState({ mustChangeLang: !this.props.isEditing && this.props.contentLang !== this.props.defaultLanguage })
    }
  }

  renderSwitchLang() {
    return (
      <div>
        <div style={{ height: 100 }}>
          <h4>Action Required</h4>
          Content element must be created in your default language first. <br />
          It will act as a fallback in case of a missing translation.
        </div>
        <p>
          <Button onClick={this.useDefaultLang} bsStyle="primary">
            Switch to {this.props.defaultLanguage.toUpperCase()} and start editing
          </Button>
          &nbsp;
          <Button bsStyle="danger" onClick={this.props.handleClose}>
            Cancel
          </Button>
        </p>
      </div>
    )
  }

  renderForm() {
    return (
      <div>
        <ContentForm
          schema={this.props.schema}
          uiSchema={this.props.uiSchema}
          formData={this.props.formData}
          isEditing={this.props.isEditing}
          onChange={this.handleEdit}
          onSubmit={this.handleSave}
        />
        <button className={classnames('bp-button', 'bp-button-danger', style.cancel)} onClick={this.props.handleClose}>
          Cancel
        </button>
      </div>
    )
  }

  render() {
    return (
      <Modal
        container={document.getElementById('app')}
        className={style.modal}
        show={this.props.show}
        onHide={this.props.handleClose}
        backdrop={'static'}
        style={{ zIndex: 1051 }}
      >
        <Modal.Body>{this.state.mustChangeLang ? this.renderSwitchLang() : this.renderForm()}</Modal.Body>
      </Modal>
    )
  }
}

export default withLanguage(CreateOrEditModal)
