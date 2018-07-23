import React from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
/*****
  DO NOT REQUIRE HEAVY DEPENDENCIES HERE
  Avoid requiring lodash here
  We're trying to keep these files as js-vanilla as possible
  To keep `lite.bundle.js` as small as possible
*****/

import InjectedComponent from '~/components/Injected'
import EventBus from '~/util/EventBus'

export default class InjectedModuleView extends React.Component {
  state = {
    moduleComponent: null
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
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.onload = () => {
        script.onload = null
        setImmediate(() => {
          this.setViewInState(moduleName, subView, isLite)
        })
      }

      const shortName = moduleName.replace(/^botpress-/i, '').replace(/^@botpress\//i, '')

      if (isLite) {
        script.src = `/js/modules/${shortName}/${subView}`
      } else {
        script.src = `/js/modules/${shortName}`
      }

      document.getElementsByTagName('head')[0].appendChild(script)
    } else {
      this.setState({ moduleComponent: null })
      setImmediate(() => {
        this.setViewInState(moduleName, subView, isLite)
      })
    }
  }

  setViewInState(moduleName, viewName, isLite) {
    const lookupNames =
      moduleName.startsWith('@botpress/') || moduleName.startsWith('botpress-')
        ? [moduleName]
        : ['@botpress/' + moduleName, 'botpress-' + moduleName]

    const viewResolve = name => {
      const prop = isLite ? 'default' : viewName
      return window.botpress && window.botpress[name] && window.botpress[name][prop]
    }

    const module = viewResolve(lookupNames.find(viewResolve))

    if (!module) {
      this.setState({
        error: new Error(`Subview "${viewName}" doesn't exist for module "${moduleName}"`),
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

    if (this.state.error) {
      console.log('Error rendering plugin', this.state.error)
      return (this.props.onNotFound && this.props.onNotFound(this.state.error)) || null
    }

    if (!moduleComponent) {
      return null
    }

    const bp = {
      events: EventBus.default,
      axios,
      toast
    }

    const extraProps = this.props.extraProps || {}

    return <InjectedComponent component={moduleComponent} name={this.props.moduleName} bp={bp} {...extraProps} />
  }
}
