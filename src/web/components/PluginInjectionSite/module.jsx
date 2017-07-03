import React from 'react'
import _ from 'lodash'
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

  loadModule(modName, viewName) {
    const moduleName = modName || this.props.moduleName
    const subView = viewName || this.props.viewName || 'default'

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
          this.setViewInState(moduleName, subView)
        })
      }
      script.src = `/js/modules/${moduleName}.js`
      document.getElementsByTagName("head")[0].appendChild(script)
    } else {
      this.setState({ moduleComponent: null })
      setImmediate(() => {
        this.setViewInState(moduleName, subView)
      })
    }
  }

  setViewInState(moduleName, viewName) {
    if (_.isNil(_.get(window, ['botpress', moduleName, viewName]))) {
      this.setState({
        error: new Error(`Subview "${viewName}" doesn't exist for module "${moduleName}"`),
        moduleComponent: null
      })
    } else {
      this.setState({
        moduleComponent: window.botpress[moduleName][viewName],
        error: null
      })
    }
  }

  componentDidMount() {
    this.loadModule()
  }

  componentWillReceiveProps(nextProps) {
    this.loadModule(nextProps.moduleName, nextProps.viewName)
  }

  render() {
    const { moduleComponent } = this.state

    if (!!this.state.error) {
      return (this.props.onNotFound && this.props.onNotFound(this.state.error)) || null
    }

    if (!moduleComponent) {
      return null
    }

    const bp = {
      events: EventBus.default,
      axios: axios
    }

    return <InjectedComponent component={moduleComponent} name={this.props.moduleName} bp={bp}/>
  }
}

// <InjectedModuleView moduleName={} viewName={} onNotFound={}/>
