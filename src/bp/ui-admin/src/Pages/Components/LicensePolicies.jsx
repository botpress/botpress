import React from 'react'
import moment from 'moment'

export default class LicenseLimits extends React.Component {
  constructor(props) {
    super(props)

    this.state = { policies: [], breachs: [] }
  }

  componentDidMount() {
    this.displayPolicies()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.license !== this.props.license) {
      this.displayPolicies()
    }
  }

  displayPolicies = () => {
    const { seats, versions, startDate, endDate } = this.props.license
    this.setState({ policies: [] })

    this.addPolicy('Admins', seats, this.getBreach('studio seats'))
    this.addPolicy('Nodes', '', this.getBreach('nodes'))
    this.addPolicy('Version', versions, this.getBreach('version'))
    this.addPolicy('Start Date', moment(startDate).format('YYYY-MM-DD'), this.getBreach('date'))
    this.addPolicy('End Date', moment(endDate).format('YYYY-MM-DD'), this.getBreach('date'))
    this.addPolicy('Server Fingerprint', '', this.getBreach('fingerprint'))
  }

  addPolicy = (name, status, breachError) => {
    this.setState(prevState => ({
      policies: [...prevState.policies, { name, status, breachError }]
    }))
  }

  getBreach(policy) {
    if (!this.props.breachs) {
      return undefined
    }

    for (const breach of this.props.breachs) {
      if (breach.toLowerCase().indexOf(policy) !== -1) {
        return breach
      }
    }
  }

  render() {
    return (
      <table className="table bp-licensing">
        <tbody>
          {this.state.policies.map((policy, idx) => {
            return (
              <tr key={idx} title={policy.breachError}>
                <td>
                  {policy.breachError ? (
                    <span role="img" aria-label="Breached">
                      ❌
                    </span>
                  ) : (
                    <span className="bp-licensing__check">✓</span>
                  )}
                </td>
                <td>{policy.name}</td>
                <td>{policy.status}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }
}
