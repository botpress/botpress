import React, { Component, Fragment } from 'react'
import _ from 'lodash'
import {
  Badge,
  UncontrolledTooltip,
  DropdownMenu,
  DropdownItem,
  DropdownToggle,
  UncontrolledButtonDropdown
} from 'reactstrap'
import api from '../../../api'

export default class KeyListItem extends Component {
  state = {
    isCancelled: false,
    isLoading: false
  }

  componentDidMount() {
    this.calculateCost()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.license !== this.props.license) {
      this.calculateCost()
    }
  }

  calculateCost() {
    const nodePrice = _.get(this.props, 'license.limits.nodes', 0) * this.getPrice('full-time-node')
    const goldSupport = _.get(this.props, 'license.quantities.isGoldSupport', false) ? this.getPrice('gold-support') : 0
    this.setState({ cost: this.getPrice('pro') + nodePrice + goldSupport })
  }

  getPrice(productName) {
    if (!this.props.products) {
      return
    }

    const product = this.props.products.find(p => p.product === productName)
    return product && product.price
  }

  disableAutoRenew = async () => {
    const { license } = this.props

    if (window.confirm('Are you sure you want to cancel auto-renew for this license?')) {
      try {
        const licensing = await api.getLicensing()
        await licensing.delete(`/me/keys/${license.stripeSubscriptionId}`)
        this.props.onLicenseUpdated({ ...license, canceled: true })
      } catch (error) {
        console.error('error canceling license')
      }
    }
  }

  revealLicense = () => this.props.onRevealActivate(this.props.license)
  showLicenseUpdateModal = () => this.props.onShowLicenseUpdateModal({ ...this.props.license, cost: this.state.cost })
  assignFingerprint = () => this.props.onRevealActivate({ ...this.props.license, assigned: false })

  useOnServer = async () => {
    this.setState({ isLoading: true })

    try {
      const key = await this.activateWithServerFingerprint()
      await this.updateServerKey(key)
      this.props.onLicenseUpdated({ ...this.props.license, fingerprint: this.props.clusterFingerprint, assigned: true })
    } catch (error) {
      console.log('error while setting up license', error)
    }
    this.setState({ isLoading: false })
    this.props.onUseOnServer()
  }

  updateServerKey = async licenseKey => {
    await api.getSecured().post(
      'admin/license/update',
      {
        licenseKey
      },
      {
        timeout: 10 * 1000
      }
    )
  }

  activateWithServerFingerprint = async () => {
    const licensing = await api.getLicensing()
    const res = await licensing.post(`/me/keys/${this.props.license.stripeSubscriptionId}/activate`, {
      fingerprint: this.props.clusterFingerprint
    })

    return res.data.key
  }

  renderActiveBadge() {
    const badgeId = this.props.license.stripeSubscriptionId
    return (
      <Fragment>
        <Badge id={`active${badgeId}`} color="primary" style={{ float: 'right', marginRight: '2px' }}>
          Active
        </Badge>

        <UncontrolledTooltip placement="right" target={`active${badgeId}`}>
          This license matches the fingerprint of the current server
        </UncontrolledTooltip>
      </Fragment>
    )
  }

  renderCancelledBadge() {
    const badgeId = this.props.license.stripeSubscriptionId
    const expiry = new Date(this.props.license.paidUntil).toLocaleDateString()
    return (
      <Fragment>
        <Badge id={`cancelled${badgeId}`} color="danger" style={{ float: 'right', marginRight: '2px' }}>
          Cancelled
        </Badge>
        <UncontrolledTooltip placement="right" target={`cancelled${badgeId}`}>
          Auto-Renew is disabled for this license and it will expire on {expiry}
        </UncontrolledTooltip>
      </Fragment>
    )
  }

  renderActions() {
    const { license } = this.props
    return (
      <UncontrolledButtonDropdown>
        <DropdownToggle caret size="sm" outline disabled={this.state.isLoading}>
          Actions
        </DropdownToggle>
        <DropdownMenu>
          {license.assigned && <DropdownItem onClick={this.revealLicense}>Reveal License Key</DropdownItem>}
          <DropdownItem onClick={this.assignFingerprint}>Assign Fingerprint</DropdownItem>
          {this.props.clusterFingerprint && <DropdownItem onClick={this.useOnServer}>Use on this Server</DropdownItem>}
          <DropdownItem onClick={this.showLicenseUpdateModal}>Update License</DropdownItem>
          {!license.canceled && <DropdownItem onClick={this.disableAutoRenew}>Disable Auto-Renew</DropdownItem>}
        </DropdownMenu>
      </UncontrolledButtonDropdown>
    )
  }

  render() {
    const { license } = this.props
    const assignedClass = license.assigned ? 'assigned' : 'not-assigned'
    const isActive = this.props.clusterFingerprint && this.props.clusterFingerprint === license.fingerprint

    return (
      <tr disabled={license.canceled}>
        <td>
          <span className="table--keys__users">
            {license.label}
            &nbsp;
            {license.canceled && this.renderCancelledBadge()}
            {isActive && this.renderActiveBadge()}
          </span>
        </td>
        <td>
          <span className="table--keys__users">{license.limits && Number(license.limits.nodes) + 1}</span>
        </td>
        <td>
          <span className="table--keys__users">{license.quantities.isGoldSupport ? 'Gold' : 'Standard'}</span>
        </td>
        <td>
          <span className={`table--keys__assigned ${assignedClass}`}>{license.assigned ? 'Yes' : 'No'}</span>
        </td>
        <td>
          <span className="table--keys__users">
            {license.canceled ? 'Disabled' : new Date(license.paidUntil).toLocaleDateString()}
          </span>
        </td>
        <td>
          <span className="table--keys__cost">{this.state.cost}$ / month</span>
        </td>
        <td>{this.renderActions()}</td>
      </tr>
    )
  }
}
