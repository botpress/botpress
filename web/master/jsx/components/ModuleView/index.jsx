import React from 'react';
import ContentWrapper from '../Layout/ContentWrapper';
import { Grid, Row, Col, Dropdown, MenuItem } from 'react-bootstrap';
import _ from 'lodash'

class ModuleView extends React.Component {

    renderWrapper(children, moduleName) {
      return <ContentWrapper>
          <div className="content-heading">
            {moduleName || this.props.params.moduleName}
          </div>
          <Row>
            {children}
          </Row>
      </ContentWrapper>
    }

    render() {

      try {
        const module = _.find(this.props.modules, { name: this.props.params.moduleName })
        if(!module) {
          throw new Error(`Module "${this.props.params.moduleName}" is not registered.`)
        }

        const req = require.context("~/modules", true, /\.jsx|\.js/i)
        const Plugin = req('./' + module.name + '/index.jsx').default
        return (this.renderWrapper(<Plugin skin={this.props.skin}/>, module.menuText));
      }
      catch (err) {
        return this.renderWrapper(<Col lg={ 4 }>
            <div id="panelDemo12" className="panel panel-danger">
                <div className="panel-heading">Could not display module</div>
                <div className="panel-body">
                    <h4>An error occured while loading the module</h4>
                    <p>{err.message}</p>
                </div>
                <div className="panel-footer">Developer? <a>click here</a> to see why this might happen</div>
            </div>
        </Col>)
      }

    }
}

export default ModuleView
