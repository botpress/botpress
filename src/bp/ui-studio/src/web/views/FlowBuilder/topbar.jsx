import React from 'react'
import _ from 'lodash'

const style = require('./topbar.scss')

export default class Topbar extends React.Component {
  getCurrentFlowName() {
    const name = _.get(this.props, 'currentFlow.name') || ''
    return this.cleanFlowName(name)
  }

  cleanFlowName(name) {
    return name.replace(/\.flow\.json$/i, '')
  }

  render() {
    const name = this.getCurrentFlowName()
    return (
      <div className={style.title}>
        <span>Flow Editor –</span>
        <span className={style.name}>&nbsp;{name}</span>
      </div>
    )
  }
}
