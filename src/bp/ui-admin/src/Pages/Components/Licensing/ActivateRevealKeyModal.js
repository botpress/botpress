import React, { Fragment } from 'react'
import { connect } from 'react-redux'
import { Modal, ModalHeader, ModalBody, Button } from 'reactstrap'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import api from '../../../api'

const DEFAULT_STATE = {
  isLoading: false,
  newFingerPrint: '',
  keyCopied: false
}

class KeyModal extends React.Component {
  constructor(props) {
    super(props)

    this.state = { ...DEFAULT_STATE }
    this.fingerprintInput = React.createRef()
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.isOpen && this.props.isOpen && !this.props.license.assigned) {
      this.fingerprintInput.current && this.fingerprintInput.current.focus()
    }

    if (this.props.license && this.props.license !== prevProps.license) {
      if (this.props.license.assigned) {
        this.getLicenseKey()
      }

      this.setState({ license: this.props.license })
    }
  }

  onKeyCopied = e => {
    this.setState({ keyCopied: true })

    window.setTimeout(() => {
      this.setState({ keyCopied: false })
    }, 1500)
  }

  async getLicenseKey() {
    const { license } = this.props
    try {
      const { data } = await api.getLicensing().post(`/me/keys/${license.stripeSubscriptionId}/generate`)
      this.setState({ key: data.key, isLoading: false })
    } catch (error) {
      this.setState({ error: error.message })
    }
  }

  activateLicense = async () => {
    const { license } = this.props
    this.setState({ isLoading: true })

    try {
      const res = await api.getLicensing().post(`/me/keys/${license.stripeSubscriptionId}/activate`, {
        fingerprint: this.state.newFingerPrint
      })

      const newLicense = res.data.license
      this.props.onLicenseChanged(newLicense)

      this.setState({
        license: newLicense,
        isLoading: false
      })
    } catch (err) {
      console.error('something went wrong trying to activate license', err)
      this.close()
    }
  }

  onFingerPrintChanged = e => {
    this.setState({ newFingerPrint: e.target.value })
  }

  close = () => {
    this.setState({ ...DEFAULT_STATE })
    this.props.toggle()
  }

  useCurrentServer = () => this.setState({ newFingerPrint: this.props.licensing.fingerprint })
  changeFingerprint = () => this.setState({ license: { assigned: false } })

  renderAssigned() {
    return (
      <ModalBody>
        <div className="modal-section-title">
          <strong>Fingerprint:</strong>
          <div>
            <Button color="link" size="sm" onClick={this.changeFingerprint}>
              <small>change fingerprint</small>
            </Button>
          </div>
        </div>
        <code>{this.state.license.fingerprint}</code>
        <hr />
        <div className="modal-section-title">
          <strong>Key:</strong>
          <div>
            <CopyToClipboard onCopy={this.onKeyCopied} text={this.state.key}>
              <Button color="link" size="sm">
                <small>copy to clipboard</small>
                {this.state.keyCopied && (
                  <span className="copied">
                    <span className="check" />
                  </span>
                )}
              </Button>
            </CopyToClipboard>
          </div>
        </div>
        <div className="modal__key">
          <code>{this.state.key}</code>
        </div>
      </ModalBody>
    )
  }

  renderUnassigned() {
    return (
      <ModalBody>
        <div>
          <label htmlFor="fingerprint">
            <strong>Fingerprint:</strong>
          </label>
          <input
            ref={this.fingerprintInput}
            className="form-control"
            type="text"
            name="fingerprint"
            id="fingerprint"
            value={this.state.newFingerPrint}
            onChange={this.onFingerPrintChanged}
          />
          <br />
          <label htmlFor="fingerprint">
            <strong>Current server:</strong>
            <small>&nbsp;(click to fill automatically)</small>
          </label>
          <br />
          <Button color="link" onClick={this.useCurrentServer}>
            {this.props.licensing.fingerprint}
          </Button>
        </div>

        <div className="modal-footer">
          <Button
            color="primary"
            onClick={this.activateLicense}
            disabled={!this.state.newFingerPrint || this.state.isLoading}
          >
            Confirm
          </Button>
        </div>
      </ModalBody>
    )
  }

  render() {
    const { license } = this.state
    if (!license) {
      return null
    }

    return (
      <Modal isOpen={this.props.isOpen} toggle={this.close}>
        <ModalHeader toggle={this.close}>Your key</ModalHeader>
        {license.assigned && this.renderAssigned()}
        {!license.assigned && this.renderUnassigned()}
      </Modal>
    )
  }
}

const mapStateToProps = state => ({
  licensing: state.license.licensing
})

export default connect(
  mapStateToProps,
  null
)(KeyModal)
