import React from 'react'
import PropTypes from 'prop-types'
import { Modal, Button } from 'react-bootstrap'

import style from './style.scss'

class License extends React.Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  state = {
    loading: true
  }

  componentDidMount() {
    this.setState({
      loading: false
    })
  }

  handleClose = () => {
    this.props.toggleLicenseModal()
  }

  renderLicenseTextArea() {
    return (
      <div>
        <textarea readOnly={true} className={style.textArea} value={this.props.license.text} />
      </div>
    )
  }

  renderCancelButton() {
    return <Button onClick={this.handleClose}>Close</Button>
  }

  render() {
    if (this.state.loading) {
      return null
    }

    return (
      <Modal show={this.props.opened} onHide={this.handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{this.props.license.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{this.renderLicenseTextArea()}</Modal.Body>
        <Modal.Footer>{this.renderCancelButton()}</Modal.Footer>
      </Modal>
    )
  }
}

export default License
