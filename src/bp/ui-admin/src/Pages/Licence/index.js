import React, { Component, Fragment } from 'react'

import SectionLayout from '../Layouts/Section'
import LoadingSection from '../Components/LoadingSection'

import displaySections from '../sections'

import { Button, Form, FormGroup, FormControl, InputGroup, Checkbox, Col, Row, Tooltip } from 'reactstrap'

export default class BuyPage extends React.Component {
  state = { loading: false }

  constructor(props) {
    super(props)

    this.toggle = this.toggle.bind(this)
    this.state = {
      tooltipOpen: false
    }
  }

  toggle() {
    this.setState({
      tooltipOpen: !this.state.tooltipOpen
    })
  }

  renderBody() {
    return (
      <Fragment>
        <Row>
          <Col sm="12" md="4">
            <div className="licence-status unlicenced">
              <span className="licence-status__badge" />
              <span className="licence-status__status">Unlicenced</span>
              <span className="licence-status__limits">Limits breached</span>
            </div>
            <div className="licence-renew">
              <Button size="sm" color="primary" outline>
                Change licence
              </Button>
              <span className="licence__or">or</span>
              <Button size="sm" color="link">
                Buy licence
              </Button>
            </div>
          </Col>
          <Col sm="12" sm={{ size: '7', offset: 1 }}>
            <div className="licence-infos licence-infos--fingerprint">
              <strong className="licence-infos__label">Server fingerprint:</strong>
              <code>be:a8:e1:db:72:68:fc:b1:07:9f:3e:01:29:e3:3e:8c</code>
              <Button color="link" size="sm" className="licence-infos__icon">
                <svg
                  href="#"
                  id="TooltipCopy"
                  height="15"
                  viewBox="0 0 16 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.996 0H16v16h-4.004v4H0V4h3.996V0zM6 2v12h8V2H6zM2 6v12h8v-1.997H3.998V6H2z"
                    fill="#4A4A4A"
                    fill-rule="evenodd"
                  />
                </svg>
              </Button>
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
            <hr />
            <div className="licence-infos">
              <strong className="licence-infos__label">Renew date:</strong>
              yyyy-mm-dd
            </div>
            <div className="licence-infos">
              <strong className="licence-infos__label">Support:</strong>
              XYZ
              <svg
                className="licence-infos__icon"
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
                  fill-rule="nonzero"
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
                Tooltip Content
              </Tooltip>
            </div>
            <hr />
            <h5>Limits</h5>
            <table className="table bp-table">
              <tbody>
                <tr>
                  <td>
                    <span className="bp-table__check">✓</span>
                  </td>
                  <td>Admins</td>
                  <td>1 out of 5</td>
                </tr>
                <tr>
                  <td>❌</td>
                  <td>version</td>
                  <td />
                </tr>
                <tr>
                  <td>
                    <span className="bp-table__check">✓</span>
                  </td>
                  <td>edition</td>
                  <td>Pro</td>
                </tr>
                <tr>
                  <td>
                    <span className="bp-table__check">✓</span>
                  </td>
                  <td>start</td>
                  <td>12/02/2019</td>
                </tr>
                <tr>
                  <td>❌</td>
                  <td>end</td>
                  <td>12/02/2019</td>
                </tr>
              </tbody>
            </table>
          </Col>
        </Row>
      </Fragment>
    )
  }

  render() {
    const renderLoading = () => <LoadingSection />

    return (
      <SectionLayout
        title="Licence status"
        sections={displaySections('licence')}
        mainContent={this.state.loading ? renderLoading() : this.renderBody()}
      />
    )
  }
}
