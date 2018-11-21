import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Panel } from 'react-bootstrap'
import classnames from 'classnames'

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
          <div className={classnames(style.whereFrom, 'bp-where-from')}>Info extracted from package.json</div>
        </Panel.Body>
      </Panel>
    )
  }
}

const mapStateToProps = state => ({ botInformation: state.bot })

export default connect(
  mapStateToProps,
  null
)(InformationComponent)
