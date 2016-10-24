import React from 'react'
import ReactDOM from 'react-dom'
import { Row, Col } from 'react-bootstrap'

export default class ModuleComponent extends React.Component {

  static propTypes: {
    component: React.PropTypes.func.isRequired
  }

  componentDidUpdate() {
    this.internalModuleRender()
  }

  componentDidMount() {
    this.internalModuleRender()
  }

  componentWillUnmount() {
    try {
      ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(this))
    } catch (err) {
      console.log('>>>>', err)
    }
  }

  render() {
    return <div className="module-mount"></div>
  }

  internalModuleRender() {
    const node = ReactDOM.findDOMNode(this)
    const moduleName = this.props.name
    try {
      const Component = this.props.component
      const element = <Component key={`module_${moduleName}`} {...this.props} />
      ReactDOM.render(element, node)
    } catch (err) {
      const element = (
          <div id="panelDemo12" className="panel panel-danger">
              <div className="panel-heading">Could not display module</div>
              <div className="panel-body">
                  <h4>An error occured while loading the module</h4>
                  <p>{err.message}</p>
              </div>
              <div className="panel-footer">Developer? <a>click here</a> to see why this might happen</div>
          </div>
        )

      ReactDOM.render(element, node)
    }
  }
}
