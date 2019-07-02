import axios from 'axios'
import React from 'react'
import { toast } from 'react-toastify'
import InjectedComponent from '~/components/Injected'
import EventBus from '~/util/EventBus'

interface Props {
  moduleName: string
  componentName: string
  lite?: boolean
  onNotFound?: any
  extraProps?: any
  contentLang?: string
}

interface State {
  error: any
  moduleComponent: any
  moduleName: string
  componentName: string
}

/*****
  DO NOT REQUIRE HEAVY DEPENDENCIES HERE
  Avoid requiring lodash here
  We're trying to keep these files as js-vanilla as possible
  To keep `lite.bundle.js` as small as possible
*****/

export default class InjectedModuleView extends React.Component<Props, State> {
  _isMounted = false
  state = {
    moduleComponent: undefined,
    moduleName: undefined,
    componentName: undefined,
    error: undefined
  }

  loadModule(modName?: string, compName?: string) {
    const moduleName = modName || this.props.moduleName
    const componentName = compName || this.props.componentName

    if (moduleName === this.state.moduleName && componentName === this.state.componentName) {
      return
    }

    this.setState({ moduleComponent: undefined, moduleName, componentName })

    if (!window.botpress || !window.botpress[moduleName]) {
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.onload = () => {
        script.onload = null
        setImmediate(() => {
          this.setViewInState(moduleName, componentName)
        })
      }

      script.src = `/assets/modules/${moduleName}/web/${this.props.lite ? 'lite.bundle.js' : 'full.bundle.js'}`
      document.getElementsByTagName('head')[0].appendChild(script)
    } else {
      this.setState({ moduleComponent: null })
      setImmediate(() => {
        this.setViewInState(moduleName, componentName)
      })
    }
  }

  loadModuleView(moduleName: string, isLite: boolean) {
    if (!window.botpress || !window.botpress[moduleName]) {
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = `/assets/modules/${moduleName}/web/${isLite ? 'lite.bundle.js' : 'full.bundle.js'}`
      document.getElementsByTagName('head')[0].appendChild(script)
    }
  }

  setViewInState(moduleName: string, componentName: string) {
    const viewResolve = () => {
      const module = window.botpress && window.botpress[moduleName]
      return module && (module[componentName] || module['default'])
    }

    if (!this._isMounted) {
      return
    }

    const module = viewResolve()

    if (!module) {
      // @deprecated : Update the error message
      this.setState({
        error: new Error(`
Component "${componentName}" doesn't exist for module "${moduleName}"

There was a breaking change in how module views are handled in Botpress 11.6
Web bundles and liteViews were replaced by a more standardized method.

Please check our migration guide here: https://botpress.io/docs/developers/migrate/`),
        moduleComponent: null
      })
    } else {
      this.setState({ moduleComponent: module, error: null })
    }
  }

  componentDidMount() {
    this._isMounted = true
    this.loadModule()
  }

  componentWillUnmount() {
    this._isMounted = false
  }

  componentWillReceiveProps(nextProps) {
    this.loadModule(nextProps.moduleName, nextProps.componentName)
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
      axios: axios.create({ baseURL: window.BOT_API_PATH }),
      toast,
      getModuleInjector: () => InjectedModuleView,
      loadModuleView: this.loadModuleView
    }
    window.botpress.injector = bp

    const extraProps = this.props.extraProps || {}

    return (
      <InjectedComponent
        component={moduleComponent}
        name={this.props.moduleName}
        contentLang={this.props.contentLang}
        bp={bp}
        {...extraProps}
      />
    )
  }
}
