import React from 'react';
import ContentWrapper from '../Layout/ContentWrapper';
import { Grid, Row, Col, Dropdown, MenuItem } from 'react-bootstrap';

class SingleView extends React.Component {

    render() {
        return (
            <ContentWrapper>
                <div className="content-heading">
                    { /* START Language list */ }
                    <div className="pull-right">
                        <Dropdown id="dropdown-tr" pullRight>
                            <Dropdown.Toggle>
                                English
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="animated fadeInUpShort">
                                <MenuItem eventKey="1" data-set-lang="en">English</MenuItem>
                                <MenuItem eventKey="2" data-set-lang="es">Spanish</MenuItem>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                    { /* END Language list */ }
                    Dashboard
                    <small data-localize="dashboard.WELCOME">Welcome to Angle!</small>
                </div>
                <Row>
                    <Col xs={12} className="text-center">
                        <h2 className="text-thin">Single view content</h2>
                        <p>
                            This project is an application skeleton. You can use it to quickly bootstrap your ReactJS webapp projects and dev environment for these projects.
                            <br/>
                            The seed app doesn't do much and has most of the feature removed so you can add theme as per your needs just following the demo app examples.
                        </p>
                    </Col>
                </Row>
            </ContentWrapper>
        );
    }
}

export default SingleView;
