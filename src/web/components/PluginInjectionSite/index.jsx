import React from 'react'
import PropTypes from 'prop-types'

import _ from 'lodash'

import { connect } from 'nuclear-js-react-addons'
import getters from '~/stores/getters'

import InjectedModuleView from '~/components/PluginInjectionSite/module'

@connect(props => ({ modules: getters.modules }))
export default class ModuleView extends React.Component {

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  renderNotFound() {
    return <div></div> // TODO Render something meaningful
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.modules) {
      return
    }

    const injectionSide = nextProps.site
    const modules = nextProps.modules.toJS()
    const pluginsToRender = []

    modules.forEach(module => {

      const toAdd = _.filter(module && module.plugins, { position: injectionSide })

      toAdd && toAdd.forEach((p, i) => {

        const moduleView = <InjectedModuleView
          key={i}
          moduleName={module.name}
          viewName={p.entry}
          onNotFound={this.renderNotFound} />

        pluginsToRender.push(moduleView)
      })

    })

    this.setState({ plugins: pluginsToRender })
  }

  render() {
    return <div className='bp-plugins bp-injection-site'>
      {this.state && this.state.plugins}
    </div>
  }
}
