import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'

const getUuid = () => `${Math.random()}`.substr(2)

export default class InjectedComponent extends Component {
  static propTypes = {
    component: PropTypes.func.isRequired
  }

  componentId = `component_${getUuid()}`

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
    return <div className="component-mount" />
  }

  // TODO: can't we do it in normal render and let the component be trashed normally too?
  // Maybe React 16 error boundaries are what we actually want
  internalRender() {
    const node = ReactDOM.findDOMNode(this)

    try {
      const props = Object.assign({}, this.props)
      delete props['component']
      ReactDOM.render(React.createElement(this.props.component, props), node)
    } catch (err) {
      const element = (
        <div className="panel panel-danger">
          <div className="panel-heading">Could not display component</div>
          <div className="panel-body">
            <h4>An error occurred while loading the component</h4>
            <p>{err.message}</p>
          </div>
          {/* TODO Put documentation / help here */}
          <div className="panel-footer">
            Developer? <a href="https://github.com/botpress/botpress/tree/master/docs">click here</a>
            to see why this might happen
          </div>
        </div>
      )

      ReactDOM.render(element, node)
      console.error && console.error('Error loading component', err)
    }
  }
}
