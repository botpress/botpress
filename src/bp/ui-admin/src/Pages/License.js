import React, { Fragment } from 'react'

import SectionLayout from './Layouts/Section'
import LoadingSection from './Components/LoadingSection'
import LicensePolicies from './Components/LicensePolicies'
import EditLicense from './Components/EditLicense'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { fetchLicensing } from '../modules/license'
import { Button, Col, Row, Tooltip, Alert } from 'reactstrap'
import moment from 'moment'

import api from '../api'

class BuyPage extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: false,
      isLicensed: false,
      isUnderLimits: true,
      serverFingerprint: '',
      paidUntil: undefined,
      supportLevel: 'none',
      tooltipOpen: false
    }
  }

  componentDidMount() {
    this.props.fetchLicensing()
  }

  componentDidUpdate(prevProps) {
    if (this.props.licensing !== prevProps.licensing) {
      this.props.licensing.license && this.displayStatus()
      this.setState({ serverFingerprint: this.props.licensing.fingerprint })
    }
  }

  displayStatus = () => {
    const { license, status } = this.props.licensing
    const { fingerprint, paidUntil, support } = license

    this.setState({
      isLicensed: status === 'licensed',
      isUnderLimits: status !== 'breached',
      licenseFingerprint: fingerprint,
      renewDate: moment(paidUntil).format('lll'),
      supportLevel: support
    })
  }

  toggle = () => {
    this.setState({
      tooltipOpen: !this.state.tooltipOpen
    })
  }

  async refreshKey() {
    await api
      .getSecured()
      .post('api/license/refresh', {
        licenseKey: this.state.licenseKey
      })
      .then(() => this.props.fetchLicensing())
  }

  renderLicenseStatus() {
    return (
      <div className={'license-status ' + (this.state.isLicensed ? 'licensed' : 'unlicensed')}>
        <div>
          <span className="license-status__badge" />
          <span className="license-status__status">{this.state.isLicensed ? 'Licensed' : 'Unlicensed'}</span>
          <span className="license-status__limits">
            {this.state.isUnderLimits ? 'Under Limits' : 'Limits breached'}
          </span>
        </div>

        <Button color="link" className="license-status__refresh" onClick={() => this.refreshKey()}>
          <svg className="icon" viewBox="0 0 90 80" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M74.59 57.824l10.498-5.863a3 3 0 1 1 2.926 5.238l-17.779 9.93a2.998 2.998 0 0 1-4.16-1.302l-8.934-18.299a3.002 3.002 0 0 1 1.38-4.013 3.005 3.005 0 0 1 4.013 1.38l5.795 11.87A33.02 33.02 0 0 0 72.865 40c0-18.311-14.897-33.207-33.209-33.207-18.31 0-33.206 14.896-33.206 33.207 0 18.312 14.896 33.209 33.206 33.209 1.236 0 2.476-.068 3.685-.202a3 3 0 0 1 .663 5.963 39.448 39.448 0 0 1-4.348.239C18.038 79.208.45 61.619.45 39.999.45 18.38 18.038.792 39.656.792c21.62 0 39.209 17.588 39.209 39.207a39.011 39.011 0 0 1-4.276 17.825z"
              fill-rule="evenodd"
            />
          </svg>
        </Button>
      </div>
    )
  }

  renderFingerprintStatus() {
    const { serverFingerprint, licenseFingerprint } = this.state
    return (
      <Fragment>
        <div className="license-infos license-infos--fingerprint">
          <strong className="license-infos__label">Server fingerprint:</strong>
          <code>{serverFingerprint}</code>
          <CopyToClipboard text={serverFingerprint}>
            <Button color="link" size="sm" className="license-infos__icon">
              <svg href="#" id="TooltipCopy" height="15" viewBox="0 0 16 20" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3.996 0H16v16h-4.004v4H0V4h3.996V0zM6 2v12h8V2H6zM2 6v12h8v-1.997H3.998V6H2z"
                  fill="#4A4A4A"
                  fillRule="evenodd"
                />
              </svg>
            </Button>
          </CopyToClipboard>
          <Tooltip
            placement="right"
            isOpen={this.state.tooltipCopy}
            target="TooltipCopy"
            toggle={() => {
              this.setState({ tooltipCopy: !this.state.tooltipCopy })
            }}
          >
            Copy to clipboard
          </Tooltip>
        </div>
        {licenseFingerprint !== undefined &&
          serverFingerprint !== licenseFingerprint && (
            <Alert color="danger">Your machine fingerprint doesn't match your license fingerprint.</Alert>
          )}
      </Fragment>
    )
  }

  renderBody() {
    return (
      <Fragment>
        <Row>
          <Col sm="12" md="5">
            {this.renderLicenseStatus()}
            <div className="license-renew">
              <EditLicense refresh={this.props.fetchLicensing} />
              <span className="license__or">or</span>
              <Button size="sm" color="link" href="http://botpress.io/my-account/buy" target="/blank">
                Buy license
              </Button>
            </div>
          </Col>
          <Col sm="12" md="7">
            {this.renderFingerprintStatus()}
            <hr />
            <div className="license-infos">
              <strong className="license-infos__label">Renew date:</strong>
              {this.state.renewDate}
            </div>
            <div className="license-infos">
              <strong className="license-infos__label">Support:</strong>
              {this.state.supportLevel}
              <svg
                className="license-infos__icon"
                href="#"
                id="TooltipSupport"
                width="15"
                height="15"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 16h2v-2H9v2zm1-16C4.477 0 0 4.477 0 10A10 10 0 1 0 10 0zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14a4 4 0 0 0-4 4h2a2 2 0 1 1 4 0c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5a4 4 0 0 0-4-4z"
                  fill="#4A4A4A"
                  fillRule="nonzero"
                />
              </svg>
              <Tooltip
                placement="right"
                isOpen={this.state.tooltip2}
                target="TooltipSupport"
                toggle={() => {
                  this.setState({ tooltip2: !this.state.tooltip2 })
                }}
              >
                This is the support offered by Botpress
              </Tooltip>
            </div>
            <hr />
            {this.props.licensing &&
              this.props.licensing.license && (
                <div>
                  <h5>Policies</h5>
                  <LicensePolicies
                    license={this.props.licensing.license}
                    breachs={this.props.licensing.breachReasons}
                  />
                </div>
              )}
          </Col>
        </Row>
      </Fragment>
    )
  }

  render() {
    const renderLoading = () => <LoadingSection />

    return (
      <SectionLayout
        title="License Status"
        activePage="license"
        mainContent={this.state.loading ? renderLoading() : this.renderBody()}
      />
    )
  }
}

const mapStateToProps = state => ({ loading: state.license.loading, licensing: state.license.licensing })
const mapDispatchToProps = dispatch => bindActionCreators({ fetchLicensing }, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BuyPage)
