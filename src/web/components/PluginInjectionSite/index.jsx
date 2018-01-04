import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import _ from 'lodash'

import InjectedModuleView from '~/components/PluginInjectionSite/module'

const collectModules = (modules, injectionSite) =>
  _.flatten(
    (modules || []).filter(Boolean).map(module => {
      const plugins = _.filter(module.plugins || [], { position: injectionSite })

      return plugins.map(plugin => ({ moduleName: module.name, viewName: plugin.entry }))
    })
  )

class InjectionSite extends React.Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  state = {
    plugins: []
  }

  renderNotFound = () => {
    return <div /> // TODO Render something meaningful
  }

  render() {
    const { site: injectionSite, modules } = this.props
    const plugins = collectModules(modules, injectionSite)

    return (
      <div className="bp-plugins bp-injection-site">
        {plugins.map(({ moduleName, viewName }, i) => (
          <InjectedModuleView key={i} moduleName={moduleName} viewName={viewName} onNotFound={this.renderNotFound} />
        ))}
      </div>
    )
  }
}

const mapStateToProps = state => ({ modules: state.modules })

export default connect(mapStateToProps)(InjectionSite)
