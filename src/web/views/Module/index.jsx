import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import _ from 'lodash'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'

import InjectedModuleView from '~/components/PluginInjectionSite/module'

class ModuleView extends React.Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  shouldComponentUpdate(nextProps) {
    return JSON.stringify(nextProps) !== JSON.stringify(this.props)
  }

  renderLink(module) {
    if (!module || !module.homepage) {
      return null
    }
    return (
      <small>
        {' '}
        &middot;{' '}
        <a target="_blank" href={module.homepage}>
          docs
        </a>
      </small>
    )
  }

  renderWrapper(children) {
    if (this.props.modules.size <= 0) {
      return null
    }

    const module = this.props.modules.find(value => value.name === this.props.params.moduleName)

    return (
      <ContentWrapper>
        <PageHeader>
          <span>
            {module && module.menuText} {this.renderLink(module)}
          </span>
        </PageHeader>
        {children}
      </ContentWrapper>
    )
  }

  renderNotFound(err) {
    return (
      <div className="panel panel-warning">
        <div className="panel-heading">Module not found</div>
        <div className="panel-body">
          <h4>The module is not properly registered</h4>
          <p>
            It seems like you are trying to load a module that has not been registered. Please make sure the module is
            registered then restart the bot.
          </p>
          {err && <p>{err}</p>}
          <p>
            {/* TODO update doc & help */}
            <a role="button" className="btn btn-primary btn-lg">
              Learn more
            </a>
          </p>
        </div>
      </div>
    )
  }

  render() {
    const { moduleName, subView } = this.props.params

    const modules = this.props.modules
    const module = _.find(modules, { name: moduleName })

    if (!module) {
      return this.renderWrapper(this.renderNotFound())
    }

    const moduleView = (
      <InjectedModuleView moduleName={moduleName} viewName={subView} onNotFound={this.renderNotFound} />
    )

    if (!moduleView) {
      return null
    }

    return this.renderWrapper(moduleView, module.menuText)
  }
}

const mapStateToProps = (state, ownProps) => ({
  modules: state.modules
})

const mapDispatchToProps = (dispatch, ownProps) => {}

export default connect(mapStateToProps, mapDispatchToProps)(ModuleView)
