import React from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Panel } from 'react-bootstrap'
import classnames from 'classnames'
import { toggleLicenseModal } from '~/actions'

const style = require('./style.scss')

class InformationComponent extends React.Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  state = {
    loading: true
  }

  componentDidMount() {
    this.setState({
      loading: false
    })
  }

  openLicenseComponent = () => {
    this.props.toggleLicenseModal()
  }

  render() {
    if (this.state.loading) {
      return null
    }

    return (
      <Panel className={classnames(style.information, 'bp-info')}>
        <Panel.Body>
          <h3 className={classnames(style.informationName, 'bp-name')}>{this.props.botInformation.name}</h3>
          <p className={classnames(style.informationDescription, 'bp-description')}>
            {this.props.botInformation.description}
          </p>
          <p className={classnames(style.informationAuthor, 'bp-author')}>
            Created by <strong>{this.props.botInformation.author}</strong>
          </p>
          <p className={classnames(style.informationVersion, 'bp-version')}>
            Version {this.props.botInformation.version}
          </p>
          <p className={classnames(style.informationLicense, 'bp-license')}>
            Licensed under{' '}
            <a href="#" onClick={this.openLicenseComponent}>
              {this.props.botInformation.license}
            </a>
          </p>
          <div className={classnames(style.whereFrom, 'bp-where-from')}>Info extracted from package.json</div>
        </Panel.Body>
      </Panel>
    )
  }
}

const mapStateToProps = state => ({ botInformation: state.bot })
const mapDispatchToProps = dispatch => bindActionCreators({ toggleLicenseModal }, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(InformationComponent)
