var React = require('react');
import ContentWrapper from '../Layout/ContentWrapper';
import { Grid, Row, Col, Dropdown, MenuItem } from 'react-bootstrap';

var SubMenu = React.createClass({

    render: function() {
        return (
            <ContentWrapper>
                <h3>Sub Menu
                   <small>Subtitle</small>
                </h3>
                <Row>
                   <Col lg={12}>
                      <p>A row with content</p>
                   </Col>
                </Row>
            </ContentWrapper>
        );
    }

});

module.exports = SubMenu;