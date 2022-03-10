import { Icon } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import moment from 'moment'
import React from 'react'
import style from './style.scss'
interface Props {
  license: any
  breachs: any
}

interface State {
  policies: any
  breachs: any
}

export default class LicenseLimits extends React.Component<Props, State> {
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

    this.addPolicy(lang.tr('admin.license.policy.admins'), seats, this.getBreach('studio seats'))
    this.addPolicy(lang.tr('admin.license.policy.nodes'), '', this.getBreach('nodes'))
    this.addPolicy(lang.tr('admin.license.policy.version'), versions, this.getBreach('version'))
    this.addPolicy(
      lang.tr('admin.license.policy.startDate'),
      moment(startDate).format('YYYY-MM-DD'),
      this.getBreach('date')
    )
    this.addPolicy(
      lang.tr('admin.license.policy.endDate'),
      moment(endDate).format('YYYY-MM-DD'),
      this.getBreach('date')
    )
    this.addPolicy(lang.tr('admin.license.policy.fingerprint'), '', this.getBreach('fingerprint'))
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
      <table className={style.table}>
        <tbody>
          {this.state.policies.map((policy, idx) => {
            return (
              <tr key={idx} title={policy.breachError}>
                <td>
                  {policy.breachError ? (
                    <Icon icon="cross" color="red"></Icon>
                  ) : (
                    <Icon icon="small-tick" color="green"></Icon>
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
