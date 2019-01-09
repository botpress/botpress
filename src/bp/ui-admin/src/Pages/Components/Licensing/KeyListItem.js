import React, { Component, Fragment } from 'react'
import { Button, Tooltip } from 'reactstrap'
import { MdEdit } from 'react-icons/lib/md'
import api from '../../../api'

export default class KeyListItem extends Component {
  state = {
    isCancelled: false,
    tooltipOpen: false
  }

  cancelLicense = () => {
    const { license, refreshLicense } = this.props

    if (window.confirm('Are you sure you want to cancel this license?')) {
      this.setState({ isCancelled: true })

      api
        .getLicensing()
        .delete(`/me/keys/${license.subscription}`)
        .then(refreshLicense)
        .catch(err => {
          console.error('error canceling license')
          this.setState({ isCancelled: false })
        })
    }
  }

  showEditLabelBox = () => {
    const { license, refreshLicense } = this.props
    const newLabel = window.prompt(`Edit the label of the selected license`, license.label)

    if (newLabel === undefined || newLabel === license.label) {
      return
    }

    api
      .getLicensing()
      .put(`/me/keys/${license.subscription}/label`, { label: newLabel })
      .then(refreshLicense)
      .catch(err => {
        console.error('cannot edit license label', err)
        this.setState({ loading: false, error: true })
      })
  }

  updateLicense = () => this.props.onLicenseUpdated(this.props.license)
  revealActivate = () => this.props.onRevealActivate(this.props.license)
  toggleTooltip = () => this.setState({ tooltipOpen: !this.state.tooltipOpen })

  render() {
    const { license } = this.props
    const assignedClass = license.assigned ? 'assigned' : 'not-assigned'
    const consideredCanceled = license.canceled || this.state.isCancelled

    return (
      <tr disabled={consideredCanceled}>
        <td>
          <span className="table--keys__users">
            {license.label}
            <Button color="link">
              <MdEdit id="editLabel" onClick={this.showEditLabelBox} />
            </Button>

            <Tooltip
              placement="right"
              size="small"
              delay={{ show: 400, hide: 300 }}
              isOpen={this.state.tooltipOpen}
              toggle={this.toggleTooltip}
              target="editLabel"
            >
              Change the label
            </Tooltip>
          </span>
        </td>
        <td>
          <span className="table--keys__users">{license.seats}</span>
        </td>
        <td>
          <span className="table--keys__users">{license.support}</span>
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
          {consideredCanceled && <span>canceled</span>}
          {!consideredCanceled && (
            <Fragment>
              <Button color="primary" size="sm" onClick={this.revealActivate}>
                {license.assigned ? 'Reveal' : 'Activate'}
              </Button>
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
