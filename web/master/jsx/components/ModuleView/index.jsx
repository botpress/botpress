import React from 'react';
import ContentWrapper from '../Layout/ContentWrapper';
import { Grid, Row, Col, Dropdown, MenuItem } from 'react-bootstrap';

class ModuleView extends React.Component {

    render() {

      const req = require.context("~/modules", true, /\.jsx|\.js/i)
      console.log(req.keys())
      const Plugin = req('./skin-messenger/index.jsx')['default']

        return (
            <ContentWrapper>
                <div className="content-heading">
                    Module view: {this.props.params.moduleName}
                </div>
                <Row>
                    <Col xs={12} className="text-center">
                        <h2 className="text-thin">Here we show the module</h2>
                        <div>
                          <Plugin></Plugin>
                        </div>
                    </Col>
                </Row>
            </ContentWrapper>
        );
    }
}

export default ModuleView
