import React from 'react';
import ContentWrapper from '../Layout/ContentWrapper';
import {Grid, Row, Col, Dropdown, MenuItem} from 'react-bootstrap';
import _ from 'lodash'

import ModuleComponent from './ModuleComponent'

class ModuleView extends React.Component {

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
            <div id="panelDemo12" className="panel panel-warning">
                <div className="panel-heading">Module not found</div>
                <div className="panel-body">
                    <h4>The module is not properly registered</h4>
                    <p>It seems like you are trying to load a module that has not been registered. Please make sure the module is registered then restart the bot.</p>
                    <p>
                        <a role="button" className="btn btn-primary btn-lg">Learn more</a>
                    </p>
                </div>
            </div>)
        return this.renderWrapper(err)
    }

    render() {
        const module = _.find(this.props.modules, {name: this.props.params.moduleName})
        if (!module) {
            if (!this.props.modules) {
                return <div></div> // TODO Loading
            } else {
                return this.renderNotFound()
            }
        }

        const req = require.context("~/modules", true, /\.jsx|\.js/i)
        const plugin = req('./' + module.name + '/index.jsx').default
        const wrappedPlugin = <ModuleComponent component={plugin} name={module.name} skin={this.props.skin}/>
        return (this.renderWrapper(wrappedPlugin, module.menuText));
    }
}

export default ModuleView
