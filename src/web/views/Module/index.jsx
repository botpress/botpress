import React from 'react'
import PropTypes from 'prop-types'

import _ from 'lodash'

import { connect } from 'nuclear-js-react-addons'
import getters from '~/stores/getters'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'

import InjectedModuleView from '~/components/PluginInjectionSite/module'

@connect(props => ({ modules: getters.modules }))
export default class ModuleView extends React.Component {

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  renderLink(module) {
    if (!module.homepage) {
      return null
    }
    return <small> &middot; <a target="_blank" href={module.homepage}>docs</a></small>
  }

  renderWrapper(children) {
    if (this.props.modules.size <= 0) {
      return null
    }

    const module = this.props.modules.find((value) => value.get('name') === this.props.params.moduleName).toJS()
    
    return <ContentWrapper>
      <PageHeader><span>{module.menuText} {this.renderLink(module)}</span></PageHeader>
      {children}
    </ContentWrapper>
  }

  renderNotFound(err) {
    return (
      <div className="panel panel-warning">
        <div className="panel-heading">Module not found</div>
        <div className="panel-body">
          <h4>The module is not properly registered</h4>
          <p>It seems like you are trying to load a module that has not been registered. Please make sure the module is registered then restart the bot.</p>
          {err && <p>{err}</p>}
          <p>
            {/* TODO update doc & help */}
            <a role="button" className="btn btn-primary btn-lg">Learn more</a>
          </p>
        </div>
      </div>
    )
  }

  render() {
    const { moduleName, subView } = this.props.params
    
    const modules = this.props.modules.toJS()
    const module = _.find(modules, { name: moduleName })

    if (!module) {
      return this.renderWrapper(this.renderNotFound())
    }

    const moduleView = <InjectedModuleView
      moduleName={moduleName}
      viewName={subView}
      onNotFound={this.renderNotFound} />

    if (!moduleView) {
      return null
    }

    return this.renderWrapper(moduleView, module.menuText)
  }
}
