import React from 'react';
import ContentWrapper from '../Layout/ContentWrapper';
import {Grid, Row, Col, Dropdown, MenuItem} from 'react-bootstrap';

export default class Home extends React.Component {

  renderLanding() {
    try{
      const req = require.context("~/landing", true, /\.jsx|\.js/i)
      const Landing = req('./index.jsx').default
      // TODO Wrap this and mount this
      // onto a separate DOM element (see ModuleComponent)
      return <Landing key="landing_page" />
    } catch (err) {
      // TODO Display better error and solution paths
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
