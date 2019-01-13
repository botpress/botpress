import React, { Component, Fragment } from 'react'
import { Button, Badge, Tooltip } from 'reactstrap'
import api from '../../../api'

export default class KeyListItem extends Component {
  state = {
    isCancelled: false,
    tooltipOpen: false
  }

  cancelLicense = () => {
    const { license, refreshLicense } = this.props

    if (window.confirm('Are you sure you want to cancel auto-renew for this license?')) {
      this.setState({ isCancelled: true })

      api
        .getLicensing()
        .delete(`/me/keys/${license.stripeSubscriptionId}`)
        .then(refreshLicense)
        .catch(err => {
          console.error('error canceling license')
          this.setState({ isCancelled: false })
        })
    }
  }

  updateLicense = () => this.props.onLicenseUpdated(this.props.license)
  revealActivate = () => this.props.onRevealActivate(this.props.license)
  toggleTooltip = () => this.setState({ tooltipOpen: !this.state.tooltipOpen })

  renderBadge() {
    if (!this.props.active) {
      return null
    }

    return (
      <Fragment>
        <Badge id="badge" color="primary">
          Active
        </Badge>
        <Tooltip
          placement="right"
          size="small"
          delay={{ show: 400, hide: 300 }}
          isOpen={this.state.tooltipOpen}
          toggle={this.toggleTooltip}
          target="badge"
        >
          That license is activated on this server
        </Tooltip>
      </Fragment>
    )
  }

  render() {
    const { license } = this.props
    const assignedClass = license.assigned ? 'assigned' : 'not-assigned'
    const consideredCanceled = license.canceled || this.state.isCancelled

    return (
      <tr disabled={consideredCanceled}>
        <td>
          <span className="table--keys__users">
            {license.label} {this.renderBadge()}
          </span>
        </td>
        <td>
          <span className="table--keys__users">{license.limits && license.limits.nodes}</span>
        </td>
        <td>
          <span className="table--keys__users">{license.quantities.isGoldSupport ? 'Gold' : 'Standard'}</span>
        </td>
        <td>
          <span className={`table--keys__assigned ${assignedClass}`}>{license.assigned ? 'Yes' : 'No'}</span>
        </td>
        <td>
          <span className="table--keys__users">{new Date(license.paidUntil).toLocaleDateString()}</span>
        </td>
        <td>
          <span className="table--keys__cost">
            {license.cost}
            $/month
          </span>
        </td>
        <td>
          <Button color="primary" size="sm" onClick={this.revealActivate}>
            {license.assigned ? 'Reveal' : 'Activate'}
          </Button>
          {consideredCanceled && <span>&nbsp; Auto-Renew Canceled</span>}

          {!consideredCanceled && (
            <Fragment>
              &nbsp;|&nbsp;
              <Button size="sm" onClick={this.updateLicense}>
                Update
              </Button>
              &nbsp;|&nbsp;
              <Button color="danger" size="sm" onClick={this.cancelLicense}>
                Cancel
              </Button>
            </Fragment>
          )}
        </td>
      </tr>
    )
  }
}
