import { inject, observer } from 'mobx-react'
import React from 'react'

import { RootStore } from '../store'
import { Overrides } from '../typings'

class OverridableComponent extends React.Component<Props, State> {
  state = {
    components: undefined
  }

  componentDidMount() {
    this.loadComponents()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.overrides !== this.props.overrides) {
      this.loadComponents()
    }
  }

  componentDidCatch(error, info) {
    console.error(`Error in overridable component ${this.props.name}. Loading original component.`, error, info)
    this.setState({ components: [{ key: 'original', element: this.props.original }] })
  }

  loadComponents() {
    this.setState({ components: this.resolveComponents() || [{ key: 'original', element: this.props.original }] })
  }

  resolveComponents = () => {
    return this.props.overrides?.[this.props.name]
      ?.map(({ module, component }) => ({
        key: `${module}:${component}`,
        element: window.botpress[module]?.[component]
      }))
      .filter(x => x.element)
  }

  render() {
    const { components } = this.state

    return components
      ? components.map(({ element: Element, key }) => Element && <Element key={key} {...this.props} />)
      : null
  }
}

export default inject(({ store }: { store: RootStore }) => ({
  store,
  overrides: store.config.overrides
}))(OverridableComponent)

interface Props {
  name: string
  overrides?: Overrides
  original?: any
}

interface State {
  components: any
}
