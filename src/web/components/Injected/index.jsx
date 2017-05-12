import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'

import _ from 'lodash'

export default class InjectedComponent extends Component {

  static propTypes: {
    component: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)
    const uuid = `${Math.random()}`.substr(2)
    this.componentId = 'component_' + uuid
  }

  componentDidUpdate() {
    this.internalRender()
  }

  componentDidMount() {
    this.internalRender()
  }

  componentWillUnmount() {
    try {
      ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(this))
    } catch (err) {
      console.error(err)
    }
  }

  render() {
    return <div className="component-mount"></div>
  }

  internalRender() {
    const node = ReactDOM.findDOMNode(this)

    try {
      const Component = this.props.component
      const passthroughProps = _.omit(this.props, 'component')
      const element = <Component key={this.componentId} {...passthroughProps} />
      ReactDOM.render(element, node)
    } catch (err) {
      const element = <div className="panel panel-danger">
        <div className="panel-heading">Could not display component</div>
        <div className="panel-body">
            <h4>An error occured while loading the component</h4>
            <p>{err.message}</p>
        </div>
        {/* TODO Put documentation / help here */}
        <div className="panel-footer">Developer? <a href="https://github.com/botpress/botpress/tree/master/docs">click here</a> to see why this might happen</div>
      </div>

      ReactDOM.render(element, node)
    }
  }
}
