import React, { Fragment } from 'react'
import { connect } from 'react-redux'
import { Modal, ModalHeader, ModalBody, Button } from 'reactstrap'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import api from '../../../api'

const DEFAULT_STATE = {
  loading: false,
  newFingerPrint: '',
  activatedLicense: null,
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
      this.fingerprintInput.current.focus()
    }
  }

  onKeyCopied = e => {
    this.setState({ keyCopied: true })

    window.setTimeout(() => {
      this.setState({ keyCopied: false })
    }, 1500)
  }

  activateLicense = async () => {
    const { license, onLicenseChanged } = this.props
    this.setState({ loading: true })

    try {
      const res = await api.getLicensing().post(`/me/keys/${license.subscription}/activate`, {
        fingerprint: this.state.newFingerPrint
      })

      const newLicense = res.data.license
      onLicenseChanged(newLicense)

      this.setState({
        activatedLicense: newLicense,
        loading: false
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

  render() {
    const { isOpen } = this.props
    const toggle = this.close
    const license = this.state.activatedLicense || this.props.license

    return (
      <Modal {...{ isOpen, toggle }}>
        <ModalHeader toggle={toggle}>Your key</ModalHeader>
        {license && license.assigned && (
          <ModalBody>
            <div className="modal-section-title">
              <strong>Fingerprint:</strong>
            </div>
            <code>{license.fingerprint}</code>
            <hr />
            <div className="modal-section-title">
              <strong>Key:</strong>
              <div>
                <CopyToClipboard onCopy={this.onKeyCopied} text={license.key}>
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
              <code>{license && license.key}</code>
            </div>
          </ModalBody>
        )}
        {license && !license.assigned && (
          <Fragment>
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
                <Button color="primary" onClick={this.activateLicense} disabled={!this.state.newFingerPrint}>
                  Confirm
                </Button>
              </div>
            </ModalBody>
          </Fragment>
        )}
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
