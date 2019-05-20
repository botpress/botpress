import { inject, observer } from 'mobx-react'
import React from 'react'

import { RootStore } from '../store'
import { Overrides } from '../typings'

class CustomComponent extends React.Component<CustomComponentProps, CustomComponentState> {
  state = {
    component: undefined
  }

  componentDidMount() {
    this.loadComponent()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.overrides !== this.props.overrides) {
      this.loadComponent()
    }
  }

  componentDidCatch(error, info) {
    console.log(`Error in overridable component ${this.props.name}. Loading original component.`, error, info)
    this.setState({ component: this.props.original })
  }

  loadComponent() {
    this.setState({
      component: this.getOverridedComponent(this.props.name) || this.props.original
    })
  }

  getOverridedComponent = (componentName: string) => {
    const overrides = this.props.overrides

    if (overrides && overrides[componentName]) {
      const { module, component } = overrides[componentName]
      if (module && component) {
        return window.botpress[module][component]
      }
    }
  }

  render() {
    if (!this.state.component) {
      return null
    }

    const Component = this.state.component
    return <Component {...this.props} />
  }
}

export default inject(({ store }: { store: RootStore }) => ({
  store,
  overrides: store.config.overrides
}))(CustomComponent)

interface CustomComponentProps {
  name: string
  overrides?: Overrides
  original?: any
}

interface CustomComponentState {
  component: JSX.Element
}
