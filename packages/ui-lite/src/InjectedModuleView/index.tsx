import axios from 'axios'
import React from 'react'
import EventBus from '../EventBus'
import InjectedComponent from './InjectedComponent'

interface Props {
  moduleName?: string
  componentName?: string
  lite?: boolean
  onNotFound?: any
  extraProps?: {
    subType?: 'component'
    botId?: string
  } & any
  contentLang?: string
  defaultLanguage?: string
  languages?: string[]
}

interface State {
  error: any
  moduleComponent: any
  moduleName?: string
  componentName?: string
}

/*****
  DO NOT REQUIRE HEAVY DEPENDENCIES HERE
  Avoid requiring lodash here
  We're trying to keep these files as js-vanilla as possible
  To keep `lite.bundle.js` as small as possible
*****/

export default class InjectedModuleView extends React.Component<Props, State> {
  _isMounted = false
  state: State = {
    moduleComponent: undefined,
    moduleName: undefined,
    componentName: undefined,
    error: undefined
  }

  getBundlePath(componentName: string, isLite?: boolean) {
    const type = this.props.extraProps?.subType
    if (!type) {
      return `assets/modules/${componentName}/web/${isLite ? 'lite.bundle.js' : 'admin.bundle.js'}`
    }

    const botId = this.props.extraProps?.botId
    if (botId) {
      return `assets/bots/${botId}/${type}/${componentName}/view.bundle.js`
    }

    return `assets/${type}/${componentName}/view.bundle.js`
  }

  loadModule(modName?: string, compName?: string) {
    const moduleName = modName || this.props.moduleName
    const componentName = compName || this.props.componentName

    if (moduleName === this.state.moduleName && componentName === this.state.componentName) {
      return
    } else if (!moduleName) {
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

      script.src = this.getBundlePath(moduleName, this.props.lite)
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
      script.src = this.getBundlePath(moduleName, isLite)
      document.getElementsByTagName('head')[0].appendChild(script)
    }
  }

  setViewInState(moduleName?: string, componentName?: string) {
    if (!moduleName) {
      return
    }

    const viewResolve = () => {
      const module = window.botpress && window.botpress[moduleName]
      return module && ((componentName && module[componentName]) || module['default'])
    }

    if (!this._isMounted) {
      return
    }

    const module = viewResolve()

    if (!module) {
      this.setState({
        error: new Error(`Component "${componentName}" doesn't exist for module "${moduleName}"`),
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

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.loadModule(nextProps.moduleName, nextProps.componentName)
  }

  render() {
    const { moduleComponent } = this.state

    if (this.state.error) {
      console.error('Error rendering plugin', this.state.error)
      return (this.props.onNotFound && this.props.onNotFound(this.state.error)) || null
    }

    if (!moduleComponent) {
      return null
    }

    const bp = {
      events: EventBus.default,
      axios: axios.create({ baseURL: window.BOT_API_PATH }),
      getModuleInjector: () => InjectedModuleView,
      loadModuleView: this.loadModuleView
    }
    window.botpress.injector = bp

    const extraProps = this.props.extraProps || {}

    return <InjectedComponent component={moduleComponent} name={this.props.moduleName} bp={bp} {...extraProps} />
  }
}
