import React from 'react'
import {
  Panel
} from 'react-bootstrap'

import classnames from 'classnames'

import { connect } from 'nuclear-js-react-addons'
import getters from '~/stores/getters'
import actions from '~/actions'

import axios from 'axios'

const style = require('./style.scss')

@connect(props => ({ botInformation: getters.botInformation }))
class InformationComponent extends React.Component {

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }

  constructor(props, context) {
    super(props, context)

    this.state = { loading: true }
  }

  componentDidMount() {
    this.setState({
      loading: false
    })
  }

  openLicenseComponent() {
    actions.toggleLicenseModal()
  }

  render() {
    if (this.state.loading) {
      return null
    }
      
    return <Panel className={classnames(style.information, 'bp-info')}>
      <h3 className={classnames(style.informationName, 'bp-name')}>
        {this.props.botInformation.get('name')}
      </h3>
      <p className={classnames(style.informationDescription, 'bp-description')}>
        {this.props.botInformation.get('description')}
      </p>
      <p className={classnames(style.informationAuthor, 'bp-author')}>
        Created by <strong>{this.props.botInformation.get('author')}</strong>
      </p>
      <p className={classnames(style.informationVersion, 'bp-version')}>
        Version {this.props.botInformation.get('version')}
      </p>
      <p className={classnames(style.informationLicense, 'bp-license')}>
        Licensed under {this.props.botInformation.get('license')} (
        <a href='#' onClick={this.openLicenseComponent}>Change</a>)
      </p>
      <div className={classnames(style.whereFrom, 'bp-where-from')}>Info extracted from package.json</div>
    </Panel>
  }
}

export default InformationComponent
