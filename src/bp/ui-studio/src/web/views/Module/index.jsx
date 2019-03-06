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
    const modules = this.props.modules
    if (!modules) {
      return null
    }

    const { moduleName, componentName } = this.props.match.params
    const module = _.find(modules, { name: moduleName })

    const contents = module ? (
      <InjectedModuleView moduleName={moduleName} componentName={componentName} onNotFound={this.renderNotFound} />
    ) : (
      this.renderNotFound()
    )

    const header = module ? <span>{module && module.menuText}</span> : `Module ${moduleName} Not Found`

    const stretch = _.get(module, 'moduleView.stretched')

    return (
      <ContentWrapper stretch={stretch}>
        <PageHeader>{header}</PageHeader>
        {contents}
      </ContentWrapper>
    )
  }
}

const mapStateToProps = state => ({
  modules: state.modules
})

export default connect(mapStateToProps)(ModuleView)
