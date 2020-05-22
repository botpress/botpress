import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import _ from 'lodash'

import InjectedModuleView from '~/components/PluginInjectionSite/module'
import { lang } from 'botpress/shared'

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
        <div className="panel-heading">{lang.tr('studio.flow.module.notFound')}</div>
        <div className="panel-body">
          <h4>{lang.tr('studio.flow.module.notProperlyRegistered')}</h4>
          <p>{lang.tr('studio.flow.module.tryingToLoad')}</p>
          {err && <p>{err}</p>}
          <p>
            {/* TODO update doc & help */}
            <a role="button" className="btn btn-primary btn-lg">
              {lang.tr('studio.flow.module.learnMore')}
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

    return module ? (
      <InjectedModuleView
        moduleName={moduleName}
        componentName={componentName}
        onNotFound={this.renderNotFound}
        contentLang={this.props.contentLang}
        defaultLanguage={this.props.defaultLanguage}
        languages={this.props.languages}
      />
    ) : (
      this.renderNotFound()
    )
  }
}

const mapStateToProps = state => ({
  modules: state.modules,
  contentLang: state.language.contentLang,
  defaultLanguage: state.bot.defaultLanguage,
  languages: state.bot.languages
})

export default connect(mapStateToProps)(ModuleView)
