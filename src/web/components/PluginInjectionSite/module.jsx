import React from 'react'
import axios from 'axios'

import InjectedComponent from '~/components/Injected'
import EventBus from '~/util/EventBus'

export default class InjectedModuleView extends React.Component {

  constructor(props, context) {
    super(props, context)

    this.state = {
      moduleComponent: null
    }
  }

  loadModule(modName, viewName, lite) {
    const moduleName = modName || this.props.moduleName
    const subView = viewName || this.props.viewName || 'default'
    const isLite = lite || this.props.lite || false

    if (moduleName === this.state.moduleName && subView == this.state.viewName) {
      return
    }

    this.setState({ moduleComponent: null, moduleName: moduleName, viewName: viewName })

    if (!window.botpress || !window.botpress[moduleName]) {
      var script = document.createElement("script")
      script.type = "text/javascript"
      script.onload = () => {
        script.onload = null
        setImmediate(() => {
          this.setViewInState(moduleName, subView, isLite)
        })
      }

      if (isLite) {
        script.src = `/js/modules/${moduleName}/${subView}`
      } else {
        script.src = `/js/modules/${moduleName}.js`
      }
      
      document.getElementsByTagName("head")[0].appendChild(script)
    } else {
      this.setState({ moduleComponent: null })
      setImmediate(() => {
        this.setViewInState(moduleName, subView, isLite)
      })
    }
  }

  setViewInState(moduleName, viewName, isLite) {

    const fullModuleName = moduleName.startsWith('botpress-')
      ? moduleName
      : 'botpress-' + moduleName

    const module = isLite 
      ? window.botpress && window.botpress[fullModuleName].default
      : window.botpress && window.botpress[fullModuleName] && window.botpress[fullModuleName][viewName]

    if (!module) {
      this.setState({
        error: new Error(`Subview "${viewName}" doesn't exist for module "${fullModuleName}"`),
        moduleComponent: null
      })
    } else {
      this.setState({
        moduleComponent: module,
        error: null
      })
    }
  }

  componentDidMount() {
    this.loadModule()
  }

  componentWillReceiveProps(nextProps) {
    this.loadModule(nextProps.moduleName, nextProps.viewName, nextProps.lite)
  }

  render() {
    const { moduleComponent } = this.state

    if (!!this.state.error) {
      console.log('Error rendering plugin', this.state.error)
      return (this.props.onNotFound && this.props.onNotFound(this.state.error)) || null
    }

    if (!moduleComponent) {
      return null
    }

    const bp = {
      events: EventBus.default,
      axios: axios
    }

    const passthroughProps = _.omit(this.props, ['moduleName', 'viewName']) 
    
    return <InjectedComponent
      component={moduleComponent}
      name={this.props.moduleName}
      bp={bp} {...passthroughProps} />
  }
}
