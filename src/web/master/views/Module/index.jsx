import React from 'react';
import _ from 'lodash'

import {connect} from 'nuclear-js-react-addons'
import getters from '~/getters'

import ContentWrapper from '~/components/Layout/ContentWrapper';
import InjectedComponent from '~/components/Injected'

const allModules = require("~/modules").modules

@connect(props => ({modules: getters.modules}))
export default class ModuleView extends React.Component {

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }

  constructor(props, context) {
    super(props, context)
  }

  renderWrapper(children, moduleName) {
    return <ContentWrapper>
      <div className="content-heading">
        {moduleName || this.props.params.moduleName}
      </div>
      {children}
    </ContentWrapper>
  }

  renderNotFound() {
    const err = (
      <div className="panel panel-warning">
        <div className="panel-heading">Module not found</div>
        <div className="panel-body">
          <h4>The module is not properly registered</h4>
          <p>It seems like you are trying to load a module that has not been registered. Please make sure the module is registered then restart the bot.</p>
          <p>
            {/* TODO update doc & help */}
            <a role="button" className="btn btn-primary btn-lg">Learn more</a>
          </p>
        </div>
      </div>
    )
    return this.renderWrapper(err)
  }

  render() {
    const { moduleName } = this.props.params
    const modules = this.props.modules.toJS()
    const module = _.find(modules, { name: moduleName })

    if (!module) {
      return this.renderNotFound()
    }

    const moduleComponent = allModules[moduleName]

    const wrappedPlugin = <InjectedComponent component={moduleComponent} name={module.name}/>
    return (this.renderWrapper(wrappedPlugin, module.menuText));
  }
}
