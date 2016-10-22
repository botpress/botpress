import React from 'react';
import ContentWrapper from '../Layout/ContentWrapper';
import {Grid, Row, Col, Dropdown, MenuItem} from 'react-bootstrap';

export default class Home extends React.Component {

  renderLanding() {
    try{
      const req = require.context("~/landing", true, /\.jsx|\.js/i)
      const Landing = req('./index.jsx').default
      return <Landing key="landing_page" />
    } catch (err) {
      return <div>No landing page</div>
    }
  }

    render() {
        return (
            <ContentWrapper>
              {this.renderLanding()}
            </ContentWrapper>
        );
    }
}
