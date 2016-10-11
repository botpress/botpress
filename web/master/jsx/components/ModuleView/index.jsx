import React from 'react';
import ContentWrapper from '../Layout/ContentWrapper';
import { Grid, Row, Col, Dropdown, MenuItem } from 'react-bootstrap';

class ModuleView extends React.Component {

    render() {
        return (
            <ContentWrapper>
                <div className="content-heading">
                    Module view: {this.props.params.moduleName}
                </div>
                <Row>
                    <Col xs={12} className="text-center">
                        <h2 className="text-thin">Here we show the module</h2>
                        {/* <p>
                            This project is an application skeleton. You can use it to quickly bootstrap your ReactJS webapp projects and dev environment for these projects.
                            <br/>
                            The seed app doesn't do much and has most of the feature removed so you can add theme as per your needs just following the demo app examples.
                        </p> */}
                    </Col>
                </Row>
            </ContentWrapper>
        );
    }
}

export default ModuleView
